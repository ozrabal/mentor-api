export class RestoreJobProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly jobProfileId: string,
  ) {}
}
