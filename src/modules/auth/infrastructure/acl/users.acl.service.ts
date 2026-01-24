import { Inject, Injectable } from "@nestjs/common";

import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../domain/repositories/user.repository.interface";
import { IdentityId } from "../../domain/value-objects/identity-id";
import { UserId } from "../../domain/value-objects/user-id";
import { IUsersACL, UserInfoDto } from "../../public/acl/users.acl.interface";

@Injectable()
export class UsersACLService implements IUsersACL {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async getUserInfo(userId: string): Promise<null | UserInfoDto> {
    const user = await this.userRepository.findById(UserId.create(userId));
    if (!user) return null;

    return {
      createdAt: user.getCreatedAt(),
      email: user.getEmail().getValue(),
      id: user.getId().getValue(),
      identityId: user.getIdentityId().getValue(),
    };
  }

  async getUserByIdentityId(identityId: string): Promise<null | UserInfoDto> {
    const user = await this.userRepository.findByIdentityId(
      IdentityId.create(identityId),
    );
    if (!user) return null;

    return {
      createdAt: user.getCreatedAt(),
      email: user.getEmail().getValue(),
      id: user.getId().getValue(),
      identityId: user.getIdentityId().getValue(),
    };
  }
}
