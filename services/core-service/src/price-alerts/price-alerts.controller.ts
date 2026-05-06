import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { CreatePriceAlertDto } from './dto/create-price-alert.dto';
import { PriceAlertsService } from './price-alerts.service';

@Controller('price-alerts')
@UseGuards(JwtAuthGuard)
export class PriceAlertsController {
  constructor(private readonly priceAlertsService: PriceAlertsService) {}

  @Post()
  createPriceAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePriceAlertDto,
  ) {
    return this.priceAlertsService.createPriceAlert(user, dto);
  }

  @Get()
  listMemberPriceAlerts(@CurrentUser() user: AuthenticatedUser) {
    return this.priceAlertsService.listMemberPriceAlerts(user);
  }

  @Delete(':id')
  deletePriceAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    return this.priceAlertsService.deletePriceAlert(user, id);
  }
}
