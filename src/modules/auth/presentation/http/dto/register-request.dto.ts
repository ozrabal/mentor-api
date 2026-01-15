import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterRequestDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "User password (minimum 6 characters)",
    example: "SecurePass123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
