import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { AuthService } from "../../../auth.service";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { RegisterCommand } from "../impl/register.command";

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: RegisterCommand): Promise<AuthResultDto> {
    return this.authService.register(command.email, command.password);
  }
}
