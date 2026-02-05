import { InterviewSession } from "../entities/interview-session.entity";
import { SessionId } from "../value-objects/session-id.vo";

export interface IInterviewSessionRepository {
  findById(id: SessionId): Promise<InterviewSession | null>;
  save(session: InterviewSession): Promise<void>;
}

export const INTERVIEW_SESSION_REPOSITORY = Symbol(
  "INTERVIEW_SESSION_REPOSITORY",
);
