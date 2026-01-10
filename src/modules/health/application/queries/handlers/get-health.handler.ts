/**
 * Get Health Query Handler
 *
 * Handles the GetHealthQuery and returns health status.
 * This follows the CQRS pattern for read operations.
 */

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetHealthQuery } from '../impl/get-health.query';
import { HealthDto } from '../../dto/health.dto';

@QueryHandler(GetHealthQuery)
export class GetHealthHandler implements IQueryHandler<GetHealthQuery> {
  async execute(query: GetHealthQuery): Promise<HealthDto> {
    return new HealthDto('ok', new Date());
  }
}
