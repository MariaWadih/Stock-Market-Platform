import { Controller, Get, MessageEvent, Sse, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { PortfolioEventsService } from './portfolio-events.service';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly portfolioEventsService: PortfolioEventsService,
  ) {}

  @Get()
  getMyPortfolio(@CurrentUser() user: AuthenticatedUser) {
    return this.portfolioService.getMyPortfolio(user);
  }

  @Sse('events')
  streamPortfolioEvents(
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<MessageEvent> {
    return this.portfolioEventsService.streamForMember(user.sub);
  }
}
