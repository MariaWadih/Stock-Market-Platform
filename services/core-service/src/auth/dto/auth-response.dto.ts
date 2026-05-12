import { CmsRole } from '../../common/enums/cms-role.enum';

export interface AuthResponseDto {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    type: 'member' | 'cms';
    role?: CmsRole;
    shouldPromptWalletFunding?: boolean;
  };
}
