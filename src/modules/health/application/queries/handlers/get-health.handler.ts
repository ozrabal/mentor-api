/**
 * Get Health Query Handler
 *
 * Handles the GetHealthQuery and returns health status.
 * This follows the CQRS pattern for read operations.
 */

import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { HealthDto } from "../../dto/health.dto";
import { GetHealthQuery } from "../impl/get-health.query";

@QueryHandler(GetHealthQuery)
export class GetHealthHandler implements IQueryHandler<GetHealthQuery> {
  async execute(_query: GetHealthQuery): Promise<HealthDto> {
    return new HealthDto("ok", new Date());
  }
}
