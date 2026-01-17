/**
 * Current User Mapper
 *
 * Maps between Application DTOs and Presentation DTOs.
 * This ensures clean separation between layers.
 */

import { CurrentUserDto } from "../../../application/dto/current-user.dto";
import { CurrentUserResponseDto } from "../dto/current-user-response.dto";

export class CurrentUserMapper {
  static toResponseDto(dto: CurrentUserDto): CurrentUserResponseDto {
    return new CurrentUserResponseDto(dto.userId, dto.email);
  }
}
