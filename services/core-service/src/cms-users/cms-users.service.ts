import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Model } from 'mongoose';
import { CmsRole } from '../common/enums/cms-role.enum';
import { CreateCmsUserDto } from './dto/create-cms-user.dto';
import { CmsUser, CmsUserDocument } from './schemas/cms-user.schema';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class CmsUsersService implements OnModuleInit {
  private readonly logger = new Logger(CmsUsersService.name);

  constructor(
    @InjectModel(CmsUser.name)
    private readonly cmsUserModel: Model<CmsUserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedInitialAdministrator();
  }

  async createCmsUser(dto: CreateCmsUserDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.cmsUserModel.exists({ email });

    if (existingUser) {
      throw new ConflictException('CMS user with this email already exists');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      PASSWORD_SALT_ROUNDS,
    );
    const cmsUser = await this.cmsUserModel.create({
      fullName: dto.fullName,
      email,
      role: dto.role,
      passwordHash,
      mustChangePassword: true,
    });

    // The messaging branch will publish cms_user.created with the temporary password.
    return {
      id: cmsUser.id,
      email: cmsUser.email,
      fullName: cmsUser.fullName,
      role: cmsUser.role,
      temporaryPassword,
    };
  }

  async listCmsUsers() {
    return this.cmsUserModel
      .find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
  }

  private async seedInitialAdministrator(): Promise<void> {
    const email = this.configService.get<string>('CMS_ADMIN_EMAIL');
    const password = this.configService.get<string>('CMS_ADMIN_PASSWORD');
    const fullName =
      this.configService.get<string>('CMS_ADMIN_FULL_NAME') ??
      'System Administrator';

    if (!email || !password) {
      return;
    }

    const existingAdministrator = await this.cmsUserModel.exists({
      email: email.toLowerCase(),
    });

    if (existingAdministrator) {
      return;
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    await this.cmsUserModel.create({
      email: email.toLowerCase(),
      fullName,
      role: CmsRole.Administrator,
      passwordHash,
      mustChangePassword: false,
    });

    this.logger.log(`Seeded initial CMS administrator: ${email}`);
  }

  private generateTemporaryPassword(): string {
    return randomBytes(18).toString('base64url');
  }
}
