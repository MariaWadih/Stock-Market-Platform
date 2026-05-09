import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { DepositDto } from './dto/deposit.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
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
  ) {}

  async getWallet(user: AuthenticatedUser) {
    this.assertMember(user);
    return this.getOrCreateWallet(new Types.ObjectId(user.sub));
  }

  async deposit(user: AuthenticatedUser, dto: DepositDto) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);
    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId },
      {
        $inc: { balance: dto.amount },
        $set: { lastDepositAt: new Date() },
        $setOnInsert: { memberId },
      },
      { upsert: true, returnDocument: 'after' },
    );

    await this.walletTransactionModel.create({
      memberId,
      walletId: wallet._id,
      type: TransactionType.Deposit,
      status: TransactionStatus.Completed,
      amount: dto.amount,
      description: 'Wallet deposit',
    });

    return wallet;
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

  private assertMember(user: AuthenticatedUser): void {
    if (user.type !== 'member') {
      throw new ForbiddenException('Only members can access wallet endpoints');
    }
  }
}
