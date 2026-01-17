/**
 * Current User Application DTO
 *
 * Data Transfer Object for current user information at the application layer.
 */

export class CurrentUserDto {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
