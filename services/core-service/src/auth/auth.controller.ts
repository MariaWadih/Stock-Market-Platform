import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterMemberDto } from './dto/register-member.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller()
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  registerMember(@Body() dto: RegisterMemberDto) {
    return this.authService.registerMember(dto);
  }

  @Post('auth/verify-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('auth/set-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  setPassword(@Body() dto: SetPasswordDto) {
    return this.authService.setPassword(dto);
  }

  @Post('auth/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  loginMember(@Body() dto: LoginDto) {
    return this.authService.loginMember(dto);
  }

  @Post('cms/auth/login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  loginCmsUser(@Body() dto: LoginDto) {
    return this.authService.loginCmsUser(dto);
  }
}
