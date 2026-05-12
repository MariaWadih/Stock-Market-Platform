import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import { IdentityVerificationStatus } from '../common/enums/identity-verification-status.enum';
import { MemberStatus } from '../common/enums/member-status.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { ReviewIdentityDto } from './dto/review-identity.dto';
import { SuspendMemberDto } from './dto/suspend-member.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Member, MemberDocument } from './schemas/member.schema';
import {
  MemberStatusAudit,
  MemberStatusAuditDocument,
} from './schemas/member-status-audit.schema';

@Injectable()
export class MembersService {
  private readonly publicMemberSelect = '-passwordHash';

  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(MemberStatusAudit.name)
    private readonly memberStatusAuditModel: Model<MemberStatusAuditDocument>,
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

  async updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
    if (user.type !== 'member') {
      throw new ForbiddenException(
        'Only members can update this profile endpoint',
      );
    }

    return this.memberModel
      .findByIdAndUpdate(
        user.sub,
        {
          $set: {
            ...dto,
            profileCompletedAt: new Date(),
          },
        },
        { new: true, runValidators: true },
      )
      .select(this.publicMemberSelect)
      .orFail(() => new NotFoundException('Member not found'))
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

  async suspendMember(
    memberId: string,
    user: AuthenticatedUser,
    dto: SuspendMemberDto,
  ) {
    const member = await this.memberModel
      .findById(memberId)
      .orFail(() => new NotFoundException('Member not found'))
      .exec();
    const previousStatus = member.status;

    member.status = MemberStatus.Suspended;
    member.suspensionReason = dto.reason;
    await member.save();
    await this.memberStatusAuditModel.create({
      memberId: member._id,
      changedBy: new Types.ObjectId(user.sub),
      fromStatus: previousStatus,
      toStatus: MemberStatus.Suspended,
      reason: dto.reason,
    });

    return this.memberModel
      .findById(memberId)
      .select(this.publicMemberSelect)
      .exec();
  }

  async reinstateMember(
    memberId: string,
    user: AuthenticatedUser,
    dto: SuspendMemberDto,
  ) {
    const member = await this.memberModel
      .findById(memberId)
      .orFail(() => new NotFoundException('Member not found'))
      .exec();
    const previousStatus = member.status;

    member.status = MemberStatus.Active;
    member.suspensionReason = undefined;
    await member.save();
    await this.memberStatusAuditModel.create({
      memberId: member._id,
      changedBy: new Types.ObjectId(user.sub),
      fromStatus: previousStatus,
      toStatus: MemberStatus.Active,
      reason: dto.reason,
    });

    return this.memberModel
      .findById(memberId)
      .select(this.publicMemberSelect)
      .exec();
  }

  async listStatusAudit(memberId: string) {
    return this.memberStatusAuditModel
      .find({ memberId: new Types.ObjectId(memberId) })
      .sort({ createdAt: -1 });
  }

  private updateMember(memberId: string, update: UpdateQuery<Member>) {
    return this.memberModel
      .findByIdAndUpdate(memberId, update, { new: true, runValidators: true })
      .select(this.publicMemberSelect)
      .orFail(() => new NotFoundException('Member not found'))
      .exec();
  }
}
