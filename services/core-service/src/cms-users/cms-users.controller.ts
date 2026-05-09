import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CmsUsersService } from './cms-users.service';
import { CreateCmsUserDto } from './dto/create-cms-user.dto';

@Controller('cms/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CmsUsersController {
  constructor(private readonly cmsUsersService: CmsUsersService) {}

  @Post()
  @Roles(CmsRole.Administrator)
  createCmsUser(@Body() dto: CreateCmsUserDto) {
    return this.cmsUsersService.createCmsUser(dto);
  }

  @Get()
  @Roles(CmsRole.Administrator)
  listCmsUsers() {
    return this.cmsUsersService.listCmsUsers();
  }
}
