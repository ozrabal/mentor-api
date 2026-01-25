/**
 * Auth Controller
 *
 * HTTP controller for authentication endpoints.
 * This controller is thin - it only orchestrates and maps.
 */

import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser } from "@/common/decorators/current-user.decorator";

import { LoginCommand } from "../../../application/commands/impl/login.command";
import { RegisterCommand } from "../../../application/commands/impl/register.command";
import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { CurrentUserDto } from "../../../application/dto/current-user.dto";
import { GetCurrentUserQuery } from "../../../application/queries/impl/get-current-user.query";
import { SupabaseJwtGuard } from "../../../guards/supabase-jwt.guard";
import { AuthResponseDto } from "../dto/auth-response.dto";
import { CurrentUserResponseDto } from "../dto/current-user-response.dto";
import { LoginRequestDto } from "../dto/login-request.dto";
import { RegisterRequestDto } from "../dto/register-request.dto";
import { AuthMapper } from "../mappers/auth.mapper";
import { CurrentUserMapper } from "../mappers/current-user.mapper";

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    description: "Get current authenticated user information",
    summary: "Get current user",
  })
  @ApiResponse({
    description: "User information retrieved successfully",
    status: 200,
    type: CurrentUserResponseDto,
  })
  @ApiResponse({
    description: "Unauthorized - invalid or missing JWT token",
    status: 401,
  })
  @Get("me")
  @UseGuards(SupabaseJwtGuard)
  async getCurrentUser(
    @CurrentUser()
    user: {
      email: string;
      id: string;
      identityId?: string;
    },
  ): Promise<CurrentUserResponseDto> {
    const userId = user.id;
    const email = user.email;
    const result = await this.queryBus.execute<
      GetCurrentUserQuery,
      CurrentUserDto
    >(new GetCurrentUserQuery(userId, email));
    return CurrentUserMapper.toResponseDto(result);
  }
}
