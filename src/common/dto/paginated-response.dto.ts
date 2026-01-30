import { ApiProperty } from "@nestjs/swagger";

export class PaginationMetadataDto {
  @ApiProperty({ example: 2, nullable: true })
  nextPage!: null | number;

  @ApiProperty({ example: 1, nullable: true })
  prevPage!: null | number;

  @ApiProperty({ example: 47 })
  totalItems!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({
    additionalProperties: true,
    example: {
      filters: {},
      limit: 10,
      page: 1,
      sort: { direction: "desc", field: "createdAt" },
    },
    type: "object",
  })
  query!: {
    filters?: Record<string, any>;
    limit: number;
    page: number;
    sort?: { direction: "asc" | "desc"; field: string };
  };
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true })
  success = true as const;

  @ApiProperty()
  data!: PaginationMetadataDto & {
    items: T[];
  };
}
