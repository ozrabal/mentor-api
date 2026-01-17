/**
 * Current User Response DTO
 *
 * HTTP response DTO for current user endpoint.
 * This is the contract exposed to clients.
 */

import { ApiProperty } from "@nestjs/swagger";

export class CurrentUserResponseDto {
  @ApiProperty({
    description: "User ID",
    example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  })
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  email: string;

  constructor(userId: string, email: string) {
    this.id = userId;
    this.email = email;
  }
}
