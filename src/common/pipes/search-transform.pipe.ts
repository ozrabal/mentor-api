import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

interface DtoWithValidation {
  validateSortField?: () => boolean;
}

interface TransformedQuery {
  [key: string]: unknown;
  pagination: {
    limit?: number;
    page?: number;
  };
  sortOptions?: {
    sort: {
      direction: string;
      field: string;
    };
  };
}

@Injectable()
export class SearchTransformPipe implements PipeTransform {
  async transform(
    value: Record<string, unknown>,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metadata.metatype) {
      return value;
    }

    // Transform flat query parameters to nested structure
    const transformed = this.transformQueryParams(value);

    // Convert to DTO class
    const dto = plainToClass(
      metadata.metatype as Type<unknown>,
      transformed,
    ) as DtoWithValidation;

    // Validate
    const errors = await validate(dto as object);
    if (errors.length > 0) {
      throw new BadRequestException("Validation failed", errors.toString());
    }

    // Validate sort field if present
    if (dto.validateSortField && !dto.validateSortField()) {
      throw new BadRequestException("Invalid sort field");
    }

    return dto;
  }

  private transformQueryParams(
    query: Record<string, unknown>,
  ): TransformedQuery {
    const transformed: TransformedQuery = {
      pagination: {},
    };

    // Extract pagination parameters (convert to numbers)
    if (query.page !== undefined) {
      const pageValue =
        typeof query.page === "string" || typeof query.page === "number"
          ? String(query.page)
          : "";
      transformed.pagination.page = parseInt(pageValue, 10);
    }
    if (query.limit !== undefined) {
      const limitValue =
        typeof query.limit === "string" || typeof query.limit === "number"
          ? String(query.limit)
          : "";
      transformed.pagination.limit = parseInt(limitValue, 10);
    }

    // Extract sort parameter (format: "field:direction")
    if (query.sort) {
      const sortValue = typeof query.sort === "string" ? query.sort : "";
      const [field, direction] = sortValue.split(":");
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
