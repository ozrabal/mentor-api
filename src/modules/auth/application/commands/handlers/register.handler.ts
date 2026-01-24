import { ConflictException, Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { AuthService } from "../../../auth.service";
import { User } from "../../../domain/entities/user.entity";
import {
  IUserRepository,
  USER_REPOSITORY,
} from "../../../domain/repositories/user.repository.interface";
import { Email } from "../../../domain/value-objects/email";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly authService: AuthService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: RegisterCommand): Promise<AuthResultDto> {
    // 1. Check if user already exists (defensive check)
    const existingUser = await this.userRepository.findByEmail(
      Email.create(command.email),
    );
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // 2. Register with Supabase (creates identity)
    const authResult = await this.authService.register(
      command.email,
      command.password,
    );

    // 3. Create domain entity
    const user = User.createNew(authResult.email, authResult.userId);

    // 4. Persist to database
    // TODO: Implement compensation logic to delete Supabase user if DB save fails
    // This requires adding a delete method to AuthService
    await this.userRepository.save(user);

    // 5. Return auth result
    return authResult;
  }
}
