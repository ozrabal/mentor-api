/**
 * Get Current User Query
 *
 * Query to retrieve current authenticated user information.
 * This is a read operation, so it uses the Query pattern.
 */

export class GetCurrentUserQuery {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
