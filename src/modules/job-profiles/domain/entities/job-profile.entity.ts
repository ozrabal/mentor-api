import { JobProfileId } from "../value-objects/job-profile-id";
import { SeniorityLevel } from "../value-objects/seniority-level";
import { UserId } from "../value-objects/user-id";
import { Competency } from "./competency.entity";

export interface JobProfileProps {
  companyName?: string;
  competencies?: Competency[];
  createdAt?: Date;
  deletedAt?: Date;
  hardSkills?: string[];
  id?: JobProfileId;
  interviewDifficultyLevel?: number;
  jobTitle?: string;
  jobUrl?: string;
  rawJD?: string;
  seniorityLevel?: SeniorityLevel;
  softSkills?: string[];
  updatedAt?: Date;
  userId: UserId;
}

export class JobProfile {
  private constructor(
    private readonly id: JobProfileId,
    private readonly userId: UserId,
    private jobTitle?: string,
    private companyName?: string,
    private jobUrl?: string,
    private rawJD?: string,
    private competencies: Competency[] = [],
    private softSkills: string[] = [],
    private hardSkills: string[] = [],
    private seniorityLevel?: SeniorityLevel,
    private interviewDifficultyLevel?: number,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt?: Date,
  ) {}

  static createNew(
    props: Omit<JobProfileProps, "deletedAt" | "id">,
  ): JobProfile {
    return new JobProfile(
      JobProfileId.generate(),
      props.userId,
      props.jobTitle,
      props.companyName,
      props.jobUrl,
      props.rawJD,
      props.competencies || [],
      props.softSkills || [],
      props.hardSkills || [],
      props.seniorityLevel,
      props.interviewDifficultyLevel,
    );
  }

  static rehydrate(props: {
    companyName?: string;
    competencies?: Competency[];
    createdAt: Date;
    deletedAt?: Date;
    hardSkills?: string[];
    id: JobProfileId;
    interviewDifficultyLevel?: number;
    jobTitle?: string;
    jobUrl?: string;
    rawJD?: string;
    seniorityLevel?: SeniorityLevel;
    softSkills?: string[];
    updatedAt: Date;
    userId: UserId;
  }): JobProfile {
    return new JobProfile(
      props.id,
      props.userId,
      props.jobTitle,
      props.companyName,
      props.jobUrl,
      props.rawJD,
      props.competencies || [],
      props.softSkills || [],
      props.hardSkills || [],
      props.seniorityLevel,
      props.interviewDifficultyLevel,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  // Getters
  getId(): JobProfileId {
    return this.id;
  }

  getUserId(): UserId {
    return this.userId;
  }

  getJobTitle(): string | undefined {
    return this.jobTitle;
  }

  getCompanyName(): string | undefined {
    return this.companyName;
  }

  getJobUrl(): string | undefined {
    return this.jobUrl;
  }

  getRawJD(): string | undefined {
    return this.rawJD;
  }

  getCompetencies(): Competency[] {
    return [...this.competencies];
  }

  getSoftSkills(): string[] {
    return [...this.softSkills];
  }

  getHardSkills(): string[] {
    return [...this.hardSkills];
  }

  getSeniorityLevel(): SeniorityLevel | undefined {
    return this.seniorityLevel;
  }

  getInterviewDifficultyLevel(): number | undefined {
    return this.interviewDifficultyLevel;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  isDeleted(): boolean {
    return this.deletedAt !== undefined;
  }

  // Business methods
  updateParsedData(data: {
    companyName?: string;
    competencies?: Competency[];
    hardSkills?: string[];
    interviewDifficultyLevel?: number;
    jobTitle?: string;
    seniorityLevel?: SeniorityLevel;
    softSkills?: string[];
  }): void {
    if (this.isDeleted()) {
      throw new Error("Cannot update deleted job profile");
    }

    if (data.jobTitle) this.jobTitle = data.jobTitle;
    if (data.companyName) this.companyName = data.companyName;
    if (data.competencies) this.competencies = data.competencies;
    if (data.softSkills) this.softSkills = data.softSkills;
    if (data.hardSkills) this.hardSkills = data.hardSkills;
    if (data.seniorityLevel) this.seniorityLevel = data.seniorityLevel;
    if (data.interviewDifficultyLevel !== undefined) {
      this.interviewDifficultyLevel = data.interviewDifficultyLevel;
    }
    this.updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted()) {
      throw new Error("Job profile is already deleted");
    }
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted()) {
      throw new Error("Job profile is not deleted");
    }
    this.deletedAt = undefined;
    this.updatedAt = new Date();
  }
}
