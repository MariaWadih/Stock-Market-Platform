import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { RejectWithdrawalDto } from './dto/reject-withdrawal.dto';
import { WithdrawalsService } from './withdrawals.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post('wallet/withdrawals')
  createWithdrawalRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.withdrawalsService.createWithdrawalRequest(user, dto);
  }

  @Get('wallet/withdrawals')
  listMyWithdrawalRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.withdrawalsService.listMyWithdrawalRequests(user);
  }

  @Get('cms/withdrawals')
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  listPendingForCms() {
    return this.withdrawalsService.listPendingForCms();
  }

  @Patch('cms/withdrawals/:id/approve')
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  approveWithdrawal(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.withdrawalsService.approveWithdrawal(id, user);
  }

  @Patch('cms/withdrawals/:id/reject')
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  rejectWithdrawal(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectWithdrawalDto,
  ) {
    return this.withdrawalsService.rejectWithdrawal(id, user, dto);
  }
}
