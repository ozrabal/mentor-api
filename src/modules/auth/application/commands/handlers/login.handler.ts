import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { AuthService } from "../../../auth.service";
import { AuthResultDto } from "../../dto/auth-result.dto";
import { LoginCommand } from "../impl/login.command";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: LoginCommand): Promise<AuthResultDto> {
    return this.authService.login(command.email, command.password);
  }
}
