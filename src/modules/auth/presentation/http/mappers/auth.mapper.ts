import { AuthResultDto } from "../../../application/dto/auth-result.dto";
import { AuthResponseDto } from "../dto/auth-response.dto";

export class AuthMapper {
  static toResponseDto(dto: AuthResultDto): AuthResponseDto {
    return {
      accessToken: dto.accessToken,
      email: dto.email,
      refreshToken: dto.refreshToken,
      userId: dto.userId,
    };
  }
}
