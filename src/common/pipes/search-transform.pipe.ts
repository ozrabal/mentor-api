import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class SearchTransformPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype) {
      return value;
    }

    // Transform flat query parameters to nested structure
    const transformed = this.transformQueryParams(value);

    // Convert to DTO class
    const dto = plainToClass(metadata.metatype, transformed);

    // Validate
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException("Validation failed", errors.toString());
    }

    // Validate sort field if present
    if (dto.validateSortField && !dto.validateSortField()) {
      throw new BadRequestException("Invalid sort field");
    }

    return dto;
  }

  private transformQueryParams(query: any): any {
    const transformed: any = {
      pagination: {},
    };

    // Extract pagination parameters (convert to numbers)
    if (query.page !== undefined) {
      transformed.pagination.page = parseInt(query.page, 10);
    }
    if (query.limit !== undefined) {
      transformed.pagination.limit = parseInt(query.limit, 10);
    }

    // Extract sort parameter (format: "field:direction")
    if (query.sort) {
      const [field, direction] = query.sort.split(":");
      transformed.sortOptions = {
        sort: {
          direction: direction || "asc",
          field,
        },
      };
    }

    // All other parameters are filters
    for (const [key, value] of Object.entries(query)) {
      if (!["limit", "page", "sort"].includes(key)) {
        transformed[key] = value;
      }
    }

    return transformed;
  }
}
