export type AuthenticatedUserType = 'member' | 'cms';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  type: AuthenticatedUserType;
  role?: string;
}
