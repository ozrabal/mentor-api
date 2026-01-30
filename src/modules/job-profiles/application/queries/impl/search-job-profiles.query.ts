export class SearchJobProfilesQuery {
  constructor(
    public readonly userId: string,
    public readonly page: number,
    public readonly limit: number,
    public readonly jobTitle?: string,
    public readonly sort?: { direction: "asc" | "desc"; field: string },
  ) {}
}
