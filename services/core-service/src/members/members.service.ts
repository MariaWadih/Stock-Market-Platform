import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, UpdateQuery } from 'mongoose';
import { IdentityVerificationStatus } from '../common/enums/identity-verification-status.enum';
import { MemberStatus } from '../common/enums/member-status.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ReviewIdentityDto } from './dto/review-identity.dto';
import { SuspendMemberDto } from './dto/suspend-member.dto';
import { Member, MemberDocument } from './schemas/member.schema';

@Injectable()
export class MembersService {
  private readonly publicMemberSelect = '-passwordHash';

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
      .select(this.publicMemberSelect)
      .orFail(() => new NotFoundException('Member not found'))
      .exec();

    return member;
  }

  async listMembers() {
    return this.memberModel
      .find()
      .select(this.publicMemberSelect)
      .sort({ createdAt: -1 })
      .exec();
  }

  async reviewIdentity(memberId: string, dto: ReviewIdentityDto) {
    if (dto.status === IdentityVerificationStatus.Pending) {
      throw new ForbiddenException('Identity review must approve or reject');
    }

    return this.updateMember(memberId, {
      $set: { identityVerificationStatus: dto.status },
    });
  }

  async suspendMember(memberId: string, dto: SuspendMemberDto) {
    return this.updateMember(memberId, {
      $set: {
        status: MemberStatus.Suspended,
        suspensionReason: dto.reason,
      },
    });
  }

  async reinstateMember(memberId: string) {
    return this.updateMember(memberId, {
      $set: { status: MemberStatus.Active },
      $unset: { suspensionReason: '' },
    });
  }

  private updateMember(memberId: string, update: UpdateQuery<Member>) {
    return this.memberModel
      .findByIdAndUpdate(memberId, update, { new: true, runValidators: true })
      .select(this.publicMemberSelect)
      .orFail(() => new NotFoundException('Member not found'))
      .exec();
  }
}
