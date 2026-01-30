export class PaginatedResult<T> {
  items!: T[];
  nextPage!: null | number;
  prevPage!: null | number;
  totalItems!: number;
  totalPages!: number;
  page!: number;
  limit!: number;
  filters?: Record<string, any>;
  sort?: { direction: "asc" | "desc"; field: string };
}
