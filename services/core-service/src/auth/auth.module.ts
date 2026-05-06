import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { CmsUser, CmsUserSchema } from '../cms-users/schemas/cms-user.schema';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.getOrThrow<string>(
          'jwt.accessExpiresIn',
        ) as SignOptions['expiresIn'];

        return {
          secret: configService.getOrThrow<string>('jwt.accessSecret'),
          signOptions: { expiresIn },
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Member.name, schema: MemberSchema },
      { name: CmsUser.name, schema: CmsUserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
