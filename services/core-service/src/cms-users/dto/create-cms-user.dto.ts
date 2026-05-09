import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CmsRole } from '../../common/enums/cms-role.enum';

export class CreateCmsUserDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsEnum(CmsRole)
  role!: CmsRole;
}
