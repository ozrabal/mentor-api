export class ParseJobDescriptionCommand {
  constructor(
    public readonly userId: string,
    public readonly jobUrl?: string,
    public readonly rawJD?: string,
    public readonly jobTitle?: string,
    public readonly seniority?: number,
  ) {}
}
