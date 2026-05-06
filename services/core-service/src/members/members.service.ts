import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdentityVerificationStatus } from '../common/enums/identity-verification-status.enum';
import { MemberStatus } from '../common/enums/member-status.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ReviewIdentityDto } from './dto/review-identity.dto';
import { SuspendMemberDto } from './dto/suspend-member.dto';
import { Member, MemberDocument } from './schemas/member.schema';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
  ) {}

  async getProfile(user: AuthenticatedUser) {
    if (user.type !== 'member') {
      throw new ForbiddenException(
        'Only members can access this profile endpoint',
      );
    }

    const member = await this.memberModel
      .findById(user.sub)
      .select('-passwordHash');
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async listMembers() {
    return this.memberModel
      .find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
  }

  async reviewIdentity(memberId: string, dto: ReviewIdentityDto) {
    if (dto.status === IdentityVerificationStatus.Pending) {
      throw new ForbiddenException('Identity review must approve or reject');
    }

    const member = await this.memberModel
      .findByIdAndUpdate(
        memberId,
        { $set: { identityVerificationStatus: dto.status } },
        { new: true },
      )
      .select('-passwordHash');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async suspendMember(memberId: string, dto: SuspendMemberDto) {
    const member = await this.memberModel
      .findByIdAndUpdate(
        memberId,
        {
          $set: {
            status: MemberStatus.Suspended,
            suspensionReason: dto.reason,
          },
        },
        { new: true },
      )
      .select('-passwordHash');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async reinstateMember(memberId: string) {
    const member = await this.memberModel
      .findByIdAndUpdate(
        memberId,
        {
          $set: { status: MemberStatus.Active },
          $unset: { suspensionReason: '' },
        },
        { new: true },
      )
      .select('-passwordHash');

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }
}
