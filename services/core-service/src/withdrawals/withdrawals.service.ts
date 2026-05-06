import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionStatus } from '../common/enums/transaction-status.enum';
import { TransactionType } from '../common/enums/transaction-type.enum';
import { WithdrawalStatus } from '../common/enums/withdrawal-status.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import {
  WalletTransaction,
  WalletTransactionDocument,
} from '../wallet/schemas/wallet-transaction.schema';
import { Wallet, WalletDocument } from '../wallet/schemas/wallet.schema';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import {
  WithdrawalRequest,
  WithdrawalRequestDocument,
} from './schemas/withdrawal-request.schema';

const WITHDRAWAL_HOLDING_PERIOD_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectModel(WithdrawalRequest.name)
    private readonly withdrawalRequestModel: Model<WithdrawalRequestDocument>,
    @InjectModel(Wallet.name)
    private readonly walletModel: Model<WalletDocument>,
    @InjectModel(WalletTransaction.name)
    private readonly walletTransactionModel: Model<WalletTransactionDocument>,
  ) {}

  async createWithdrawalRequest(
    user: AuthenticatedUser,
    dto: CreateWithdrawalDto,
  ) {
    this.assertMember(user);
    const memberId = new Types.ObjectId(user.sub);
    const wallet = await this.walletModel.findOne({ memberId });

    if (!wallet || wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    if (
      wallet.lastDepositAt &&
      Date.now() - wallet.lastDepositAt.getTime() < WITHDRAWAL_HOLDING_PERIOD_MS
    ) {
      throw new BadRequestException(
        'Withdrawals are only available 48 hours after the most recent deposit',
      );
    }

    return this.withdrawalRequestModel.create({
      memberId,
      amount: dto.amount,
      status: WithdrawalStatus.Pending,
    });
  }

  async listMyWithdrawalRequests(user: AuthenticatedUser) {
    this.assertMember(user);

    return this.withdrawalRequestModel
      .find({ memberId: new Types.ObjectId(user.sub) })
      .sort({ createdAt: -1 });
  }

  async listPendingForCms() {
    return this.withdrawalRequestModel
      .find({ status: WithdrawalStatus.Pending })
      .sort({ createdAt: 1 });
  }

  async approveWithdrawal(requestId: string, reviewer: AuthenticatedUser) {
    const request = await this.withdrawalRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (request.status !== WithdrawalStatus.Pending) {
      throw new ConflictException(
        'Withdrawal request has already been reviewed',
      );
    }

    const wallet = await this.walletModel.findOneAndUpdate(
      { memberId: request.memberId, balance: { $gte: request.amount } },
      { $inc: { balance: -request.amount } },
      { returnDocument: 'after' },
    );

    if (!wallet) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    request.status = WithdrawalStatus.Approved;
    request.reviewedBy = new Types.ObjectId(reviewer.sub);
    request.reviewedAt = new Date();
    await request.save();

    await this.walletTransactionModel.create({
      memberId: request.memberId,
      walletId: wallet._id,
      type: TransactionType.Withdrawal,
      status: TransactionStatus.Completed,
      amount: request.amount,
      withdrawalRequestId: request._id,
      description: 'Withdrawal approved',
    });

    return request;
  }

  async rejectWithdrawal(
    requestId: string,
    reviewer: AuthenticatedUser,
    dto: RejectWithdrawalDto,
  ) {
    const request = await this.withdrawalRequestModel.findById(requestId);

    if (!request) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (request.status !== WithdrawalStatus.Pending) {
      throw new ConflictException(
        'Withdrawal request has already been reviewed',
      );
    }

    request.status = WithdrawalStatus.Rejected;
    request.reviewedBy = new Types.ObjectId(reviewer.sub);
    request.reviewedAt = new Date();
    request.rejectionReason = dto.reason;
    await request.save();

    return request;
  }

  private assertMember(user: AuthenticatedUser): void {
    if (user.type !== 'member') {
      throw new ForbiddenException(
        'Only members can create withdrawal requests',
      );
    }
  }
}
