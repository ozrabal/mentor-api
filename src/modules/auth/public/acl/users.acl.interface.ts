export interface UserInfoDto {
  createdAt: Date;
  email: string;
  id: string;
  identityId: string;
}

export interface IUsersACL {
  getUserByIdentityId(identityId: string): Promise<null | UserInfoDto>;
  getUserInfo(userId: string): Promise<null | UserInfoDto>;
}
