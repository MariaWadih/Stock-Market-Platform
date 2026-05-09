import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All(['', '*path'])
  forward(@Req() request: Request, @Res() response: Response): Promise<void> {
    return this.gatewayService.handle(request, response);
  }
}
