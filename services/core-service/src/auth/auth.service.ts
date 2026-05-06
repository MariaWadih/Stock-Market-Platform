import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Model, Types } from 'mongoose';
import { CmsUser, CmsUserDocument } from '../cms-users/schemas/cms-user.schema';
import { MemberStatus } from '../common/enums/member-status.enum';
import { OtpPurpose } from '../common/enums/otp-purpose.enum';
import { AuthenticatedUser } from '../common/types/authenticated-user';
import { Member, MemberDocument } from '../members/schemas/member.schema';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Otp, OtpDocument } from './schemas/otp.schema';

const OTP_TTL_MINUTES = 10;
const MINIMUM_MEMBER_AGE = 18;
const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Member.name)
    private readonly memberModel: Model<MemberDocument>,
    @InjectModel(CmsUser.name)
    private readonly cmsUserModel: Model<CmsUserDocument>,
    @InjectModel(Otp.name)
    private readonly otpModel: Model<OtpDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async registerMember(dto: RegisterMemberDto): Promise<{ message: string }> {
    this.assertAdult(dto.dateOfBirth);

    const email = dto.email.toLowerCase();
    const existingMember = await this.memberModel.exists({
      $or: [{ email }, { nationalId: dto.nationalId }],
    });

    if (existingMember) {
      throw new ConflictException(
        'A member with this email or national ID exists',
      );
    }

    const member = await this.memberModel.create({
      fullName: dto.fullName,
      email,
      nationalId: dto.nationalId,
      dateOfBirth: dto.dateOfBirth,
    });

    await this.createOtp(email, member._id);

    return {
      message:
        'Registration started. Verify the OTP sent to your email within 10 minutes.',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const otp = await this.otpModel
      .findOne({
        email,
        purpose: OtpPurpose.MemberRegistration,
        consumedAt: { $exists: false },
      })
      .sort({ createdAt: -1 });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    const isValid = await bcrypt.compare(dto.code, otp.codeHash);
    if (!isValid) {
      await this.otpModel.updateOne(
        { _id: otp._id },
        { $inc: { attempts: 1 } },
      );
      throw new BadRequestException('Invalid OTP');
    }

    await this.otpModel.updateOne(
      { _id: otp._id },
      { $set: { consumedAt: new Date() } },
    );
    await this.memberModel.updateOne(
      { email },
      { $set: { isEmailVerified: true } },
    );

    return { message: 'Email verified. You can now set your password.' };
  }

  async setPassword(dto: SetPasswordDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const member = await this.memberModel.findOne({ email });

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    if (!member.isEmailVerified) {
      throw new BadRequestException(
        'Email must be verified before setting a password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, PASSWORD_SALT_ROUNDS);
    await this.memberModel.updateOne(
      { _id: member._id },
      { $set: { passwordHash } },
    );

    return { message: 'Password set successfully' };
  }

  async loginMember(dto: LoginDto): Promise<AuthResponseDto> {
    const member = await this.memberModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (!member?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!member.isEmailVerified) {
      throw new UnauthorizedException('Email is not verified');
    }

    if (member.status === MemberStatus.Suspended) {
      throw new UnauthorizedException('Member account is suspended');
    }

    const isValid = await bcrypt.compare(dto.password, member.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signMember(member);
  }

  async loginCmsUser(dto: LoginDto): Promise<AuthResponseDto> {
    const cmsUser = await this.cmsUserModel.findOne({
      email: dto.email.toLowerCase(),
      isActive: true,
    });

    if (!cmsUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(dto.password, cmsUser.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signCmsUser(cmsUser);
  }

  private async createOtp(
    email: string,
    memberId: Types.ObjectId,
  ): Promise<void> {
    const code = randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, PASSWORD_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.otpModel.create({
      email,
      purpose: OtpPurpose.MemberRegistration,
      codeHash,
      expiresAt,
      memberId,
    });

    // The messaging branch will publish auth.otp.created from here.
  }

  private assertAdult(dateOfBirth: Date): void {
    const today = new Date();
    const minimumBirthDate = new Date(
      today.getFullYear() - MINIMUM_MEMBER_AGE,
      today.getMonth(),
      today.getDate(),
    );

    if (dateOfBirth > minimumBirthDate) {
      throw new BadRequestException('Member must be at least 18 years old');
    }
  }

  private async signMember(member: MemberDocument): Promise<AuthResponseDto> {
    const payload: AuthenticatedUser = {
      sub: member.id,
      email: member.email,
      type: 'member',
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: member.id,
        email: member.email,
        fullName: member.fullName,
        type: 'member',
      },
    };
  }

  private async signCmsUser(
    cmsUser: CmsUserDocument,
  ): Promise<AuthResponseDto> {
    const payload: AuthenticatedUser = {
      sub: cmsUser.id,
      email: cmsUser.email,
      type: 'cms',
      role: cmsUser.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: cmsUser.id,
        email: cmsUser.email,
        fullName: cmsUser.fullName,
        type: 'cms',
        role: cmsUser.role,
      },
    };
  }
}
