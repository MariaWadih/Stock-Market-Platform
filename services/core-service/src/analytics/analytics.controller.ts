import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActiveMembersQueryDto } from './dto/active-members-query.dto';
import { AnalyticsPaginationQueryDto } from './dto/analytics-pagination-query.dto';
import { TradingVolumeQueryDto } from './dto/trading-volume-query.dto';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(CmsRole.Administrator, CmsRole.Analyst)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('volume')
  getTradingVolume(@Query() query: TradingVolumeQueryDto) {
    return this.analyticsService.getTradingVolume(query);
  }

  @Get('stocks/top')
  getTopTradedStocks(@Query() query: AnalyticsPaginationQueryDto) {
    return this.analyticsService.getTopTradedStocks(query);
  }

  @Get('aum')
  getAssetsUnderManagement() {
    return this.analyticsService.getAssetsUnderManagement();
  }

  @Get('members/active')
  getMostActiveMembers(@Query() query: ActiveMembersQueryDto) {
    return this.analyticsService.getMostActiveMembers(query);
  }

  @Get('sectors')
  getSectorAllocation() {
    return this.analyticsService.getSectorAllocation();
  }
}
