export class JobProfileNotFoundError extends Error {
  constructor(id: string) {
    super(`Job profile with id ${id} not found`);
    this.name = "JobProfileNotFoundError";
  }
}

export class InvalidJobDescriptionError extends Error {
  constructor(message: string) {
    super(`Invalid job description: ${message}`);
    this.name = "InvalidJobDescriptionError";
  }
}

export class JobDescriptionParsingError extends Error {
  constructor(message: string) {
    super(`Failed to parse job description: ${message}`);
    this.name = "JobDescriptionParsingError";
  }
}
