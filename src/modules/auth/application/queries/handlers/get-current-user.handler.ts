/**
 * Get Current User Query Handler
 *
 * Handles the GetCurrentUserQuery and returns current user information.
 * This follows the CQRS pattern for read operations.
 */

import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { CurrentUserDto } from "../../dto/current-user.dto";
import { GetCurrentUserQuery } from "../impl/get-current-user.query";

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(query: GetCurrentUserQuery): Promise<CurrentUserDto> {
    return new CurrentUserDto(query.userId, query.email);
  }
}
