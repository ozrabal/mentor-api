export class GetJobProfileQuery {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
