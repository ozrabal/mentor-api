export class SoftDeleteJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
