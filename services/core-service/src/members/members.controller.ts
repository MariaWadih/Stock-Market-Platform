import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CmsRole } from '../common/enums/cms-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ObjectIdPipe } from '../common/pipes/object-id.pipe';
import type { AuthenticatedUser } from '../common/types/authenticated-user';
import { ReviewIdentityDto } from './dto/review-identity.dto';
import { SuspendMemberDto } from './dto/suspend-member.dto';
import { MembersService } from './members.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('members/me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.membersService.getProfile(user);
  }

  @Get('cms/members')
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  listMembers() {
    return this.membersService.listMembers();
  }

  @Patch('cms/members/:id/identity')
  @Roles(CmsRole.Administrator, CmsRole.SupportAgent)
  reviewIdentity(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: ReviewIdentityDto,
  ) {
    return this.membersService.reviewIdentity(id, dto);
  }

  @Patch('cms/members/:id/suspend')
  @Roles(CmsRole.Administrator)
  suspendMember(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: SuspendMemberDto,
  ) {
    return this.membersService.suspendMember(id, dto);
  }

  @Patch('cms/members/:id/reinstate')
  @Roles(CmsRole.Administrator)
  reinstateMember(@Param('id', ObjectIdPipe) id: string) {
    return this.membersService.reinstateMember(id);
  }
}
