import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SuspendMemberDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  reason!: string;
}
