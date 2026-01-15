/**
 * Auth Controller
 *
 * HTTP controller for authentication endpoints.
 * This controller is thin - it only orchestrates and maps.
 */

import { Body, Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { LoginCommand } from "../../../application/commands/impl/login.command";
import { RegisterCommand } from "../../../application/commands/impl/register.command";
import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { LoginRequestDto } from "../dto/login-request.dto";
import { RegisterRequestDto } from "../dto/register-request.dto";
import { AuthMapper } from "../mappers/auth.mapper";

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({
    description: "Register a new user account",
    summary: "Register user",
  })
  @ApiResponse({
    description: "User registered successfully",
    status: 201,
    type: AuthResponseDto,
  })
  @ApiResponse({
    description: "Bad request (validation error)",
    status: 400,
  })
  @ApiResponse({
    description: "Unauthorized (registration failed)",
    status: 401,
  })
  @Post("register")
  async register(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const result = await this.commandBus.execute<
      RegisterCommand,
      AuthResultDto
    >(new RegisterCommand(dto.email, dto.password));
    return AuthMapper.toResponseDto(result);
  }

  @ApiOperation({
    description: "Login with email and password",
    summary: "Login user",
  })
  @ApiResponse({
    description: "Login successful",
    status: 200,
    type: AuthResponseDto,
  })
  @ApiResponse({
    description: "Bad request (validation error)",
    status: 400,
  })
  @ApiResponse({
    description: "Unauthorized (invalid credentials)",
    status: 401,
  })
  @Post("login")
  async login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    const result = await this.commandBus.execute<LoginCommand, AuthResultDto>(
      new LoginCommand(dto.email, dto.password),
    );
    return AuthMapper.toResponseDto(result);
  }
}
