import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { NotificationEventType } from '../notifications/notification-event';
import { NotificationsService } from '../notifications/notifications.service';
import { DepositDto } from './dto/deposit.dto';
import { ManualWalletAdjustmentDto } from './dto/manual-wallet-adjustment.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import {
  WalletAdjustmentAudit,
  WalletAdjustmentAuditDocument,
} from './schemas/wallet-adjustment-audit.schema';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from './schemas/wallet-transaction.schema';
import { Wallet, WalletDocument } from './schemas/wallet.schema';

interface WalletTransactionFilter {
  memberId: Types.ObjectId;
  type?: TransactionType;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransactionDocument>,
    @InjectModel(WalletAdjustmentAudit.name)
    private readonly walletAdjustmentAuditModel: Model<WalletAdjustmentAuditDocument>,
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  async getWallet(user: AuthenticatedUser) {
    this.assertMember(user);
    return this.getOrCreateWallet(new Types.ObjectId(user.sub));
  }

  async createDepositCheckout(user: AuthenticatedUser, dto: DepositDto) {
    this.assertMember(user);
    const stripe = this.getStripeClient();
    const memberId = new Types.ObjectId(user.sub);
    const wallet = await this.getOrCreateWallet(memberId);
    const member = await this.memberModel
      .findById(memberId)
      .select('email')
      .orFail(() => new NotFoundException('Member not found'))
      .exec();
    const amountInCents = Math.round(dto.amount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: member.email,
      success_url: this.configService.getOrThrow<string>('stripe.successUrl'),
      cancel_url: this.configService.getOrThrow<string>('stripe.cancelUrl'),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountInCents,
            product_data: {
              name: 'Stock platform wallet deposit',
            },
          },
        },
      ],
      metadata: {
        memberId: memberId.toString(),
        amount: dto.amount.toString(),
      },
    });

    await this.walletTransactionModel.create({
      memberId,
      walletId: wallet._id,
      type: TransactionType.Deposit,
      status: TransactionStatus.Pending,
      amount: dto.amount,
      description: 'Stripe Checkout wallet deposit',
      paymentProvider: 'stripe',
      providerTransactionId: session.id,
    });

    return {
      provider: 'stripe',
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
    };
  }

  async handleStripeWebhook(rawBody?: Buffer, signature?: string) {
    if (!rawBody || !signature) {
      throw new BadRequestException('Missing Stripe webhook payload');
    }

    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook secret is not configured');
    }

    const event = this.getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );

    if (event.type !== 'checkout.session.completed') {
      return { received: true, ignored: true };
    }

    const session = event.data.object;
    if (session.payment_status !== 'paid') {
      return { received: true, ignored: true };
    }

    const memberId = session.metadata?.memberId;
    const amount = Number(session.metadata?.amount);
    if (!memberId || !Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Stripe session metadata is invalid');
    }

    const transaction = await this.walletTransactionModel.findOneAndUpdate(
      {
        paymentProvider: 'stripe',
        providerTransactionId: session.id,
        status: TransactionStatus.Pending,
      },
      { $set: { status: TransactionStatus.Completed } },
      { returnDocument: 'after' },
    );

    if (!transaction) {
      return { received: true, alreadyProcessed: true };
    }

    const wallet = await this.creditWallet(
      new Types.ObjectId(memberId),
      amount,
    );
    await this.publishWalletCredited(
      new Types.ObjectId(memberId),
      amount,
      wallet.balance,
    );

    return { received: true };
  }

  async listTransactions(user: AuthenticatedUser, query: TransactionQueryDto) {
    this.assertMember(user);
    const filter: WalletTransactionFilter = {
      memberId: new Types.ObjectId(user.sub),
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = query.from;
      if (query.to) filter.createdAt.$lte = query.to;
    }

    return this.walletTransactionModel.find(filter).sort({ createdAt: -1 });
  }

  async listMemberTransactionsForCms(
    memberId: string,
    query: TransactionQueryDto,
  ) {
    const filter: WalletTransactionFilter = {
      memberId: new Types.ObjectId(memberId),
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = query.from;
      if (query.to) filter.createdAt.$lte = query.to;
    }

    return this.walletTransactionModel.find(filter).sort({ createdAt: -1 });
  }

  async adjustMemberWallet(
    memberId: string,
    user: AuthenticatedUser,
    dto: ManualWalletAdjustmentDto,
  ) {
    if (dto.amount === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    const memberObjectId = new Types.ObjectId(memberId);
    const wallet = await this.getOrCreateWallet(memberObjectId);
    const previousBalance = wallet.balance;
    const newBalance = previousBalance + dto.amount;

    await this.walletModel.updateOne(
      { _id: wallet._id },
      { $set: { balance: newBalance } },
    );

    const audit = await this.walletAdjustmentAuditModel.create({
      memberId: memberObjectId,
      walletId: wallet._id,
      adjustedBy: new Types.ObjectId(user.sub),
      previousBalance,
      adjustmentAmount: dto.amount,
      newBalance,
      justification: dto.justification,
    });

    await this.walletTransactionModel.create({
      memberId: memberObjectId,
      walletId: wallet._id,
      type: TransactionType.ManualAdjustment,
      status: TransactionStatus.Completed,
      amount: Math.abs(dto.amount),
      description: dto.justification,
    });

    return {
      walletId: wallet.id,
      memberId,
      previousBalance,
      adjustmentAmount: dto.amount,
      newBalance,
      auditId: audit.id,
    };
  }

  async listMemberWalletAdjustments(memberId: string) {
    return this.walletAdjustmentAuditModel
      .find({ memberId: new Types.ObjectId(memberId) })
      .sort({ createdAt: -1 });
  }

  async getOrCreateWallet(memberId: Types.ObjectId): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId },
      { $setOnInsert: { memberId, balance: 0 } },
      { upsert: true, returnDocument: 'after' },
    );

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return wallet;
  }

  private async creditWallet(
    memberId: Types.ObjectId,
    amount: number,
  ): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId },
      {
        $inc: { balance: amount },
        $set: { lastDepositAt: new Date() },
        $setOnInsert: { memberId },
      },
      { upsert: true, returnDocument: 'after' },
    );

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.memberModel.updateOne(
      { _id: memberId },
      { $set: { hasFundedWallet: true } },
    );

    return wallet;
  }

  private async publishWalletCredited(
    memberId: Types.ObjectId,
    amount: number,
    balance: number,
  ): Promise<void> {
    const member = await this.memberModel
      .findById(memberId)
      .select('email fullName')
      .orFail(() => new NotFoundException('Member not found'))
      .exec();

    await this.notificationsService.publish({
      type: NotificationEventType.WalletCredited,
      occurredAt: new Date().toISOString(),
      payload: {
        email: member.email,
        fullName: member.fullName,
        amount,
        balance,
      },
    });
  }

  private getStripeClient() {
    const secretKey = this.configService.get<string>('stripe.secretKey');

    if (!secretKey) {
      throw new BadRequestException('Stripe secret key is not configured');
    }

    return new Stripe(secretKey);
  }

  private assertMember(user: AuthenticatedUser): void {
    if (user.type !== 'member') {
      throw new ForbiddenException('Only members can access wallet endpoints');
    }
  }
}
