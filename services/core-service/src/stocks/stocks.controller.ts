import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockPriceDto } from './dto/update-stock-price.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { StocksService } from './stocks.service';

@Controller()
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post('cms/stocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst)
  createStock(@Body() dto: CreateStockDto) {
    return this.stocksService.createStock(dto);
  }

  @Get('stocks')
  listListedStocks() {
    return this.stocksService.listListedStocks();
  }

  @Get('cms/stocks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst, CmsRole.SupportAgent)
  listAllStocksForCms() {
    return this.stocksService.listAllStocksForCms();
  }

  @Get('stocks/:id')
  getListedStock(@Param('id', ObjectIdPipe) id: string) {
    return this.stocksService.getListedStock(id);
  }

  @Get('cms/stocks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst, CmsRole.SupportAgent)
  getStockForCms(@Param('id', ObjectIdPipe) id: string) {
    return this.stocksService.getStockForCms(id);
  }

  @Patch('cms/stocks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst)
  updateStock(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.stocksService.updateStock(id, dto);
  }

  @Patch('cms/stocks/:id/price')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst)
  updateStockPrice(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateStockPriceDto,
  ) {
    return this.stocksService.updateStockPrice(id, dto);
  }

  @Patch('cms/stocks/:id/delist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(CmsRole.Administrator, CmsRole.Analyst)
  delistStock(@Param('id', ObjectIdPipe) id: string) {
    return this.stocksService.delistStock(id);
  }

  @Get('stocks/:id/history')
  getPriceHistory(@Param('id', ObjectIdPipe) id: string) {
    return this.stocksService.getPriceHistory(id);
  }
}
