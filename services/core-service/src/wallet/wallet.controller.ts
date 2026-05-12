import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { DepositDto } from './dto/deposit.dto';
import { ManualWalletAdjustmentDto } from './dto/manual-wallet-adjustment.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { WalletService } from './wallet.service';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.walletService.getWallet(user);
  }

  @Post('wallet/deposit/checkout')
  @UseGuards(JwtAuthGuard)
  createDepositCheckout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DepositDto,
  ) {
    return this.walletService.createDepositCheckout(user, dto);
  }

  @Get('wallet/deposit/success')
  getDepositSuccess() {
    return {
      message:
        'Deposit payment completed. Your wallet will update once the payment confirmation is processed.',
    };
  }

  @Get('wallet/deposit/cancel')
  getDepositCancel() {
    return {
      message: 'Deposit payment was cancelled. Your wallet was not charged.',
    };
  }

  @Post('wallet/deposit/webhook')
  handleDepositWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    return this.walletService.handleStripeWebhook(request.rawBody, signature);
  }

  @Get('wallet/transactions')
  @UseGuards(JwtAuthGuard)
  listTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.listTransactions(user, query);
  }

  @Get('cms/members/:memberId/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  listMemberTransactionsForCms(
    @Param('memberId', ObjectIdPipe) memberId: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.walletService.listMemberTransactionsForCms(memberId, query);
  }

  @Post('cms/members/:memberId/wallet/adjustments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator)
  adjustMemberWallet(
    @Param('memberId', ObjectIdPipe) memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualWalletAdjustmentDto,
  ) {
    return this.walletService.adjustMemberWallet(memberId, user, dto);
  }

  @Get('cms/members/:memberId/wallet/adjustments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator)
  listMemberWalletAdjustments(
    @Param('memberId', ObjectIdPipe) memberId: string,
  ) {
    return this.walletService.listMemberWalletAdjustments(memberId);
  }
}
