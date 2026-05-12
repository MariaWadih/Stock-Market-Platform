import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { Member, MemberSchema } from './schemas/member.schema';
import {
  MemberStatusAudit,
  MemberStatusAuditSchema,
} from './schemas/member-status-audit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: MemberStatusAudit.name, schema: MemberStatusAuditSchema },
    ]),
  ],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
