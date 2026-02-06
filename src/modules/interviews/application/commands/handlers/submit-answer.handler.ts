import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import {
  IJobProfilesACL,
  JOB_PROFILES_ACL,
} from "@/modules/job-profiles/public";

import { INTERVIEW_SESSION_REPOSITORY } from "../../../domain/repositories/interview-session.repository.interface";
import { IInterviewSessionRepository } from "../../../domain/repositories/interview-session.repository.interface";
import { SessionId } from "../../../domain/value-objects/session-id.vo";
import {
  AnswerScoringDto,
  QuestionDto,
  SubmitAnswerResultDto,
} from "../../dto/submit-answer.dto";
import { AdaptiveQuestionSelectorService } from "../../services/adaptive-question-selector.service";
import { FeedbackGeneratorService } from "../../services/feedback-generator.service";
import { ScoringService } from "../../services/scoring.service";
import { SubmitAnswerCommand } from "../impl/submit-answer.command";

/**
 * Handler for submitting an answer to an interview question
 *
 * Step 2: Real implementation with scoring, question selection, and session updates
 */
@CommandHandler(SubmitAnswerCommand)
export class SubmitAnswerHandler implements ICommandHandler<SubmitAnswerCommand> {
  constructor(
    @Inject(INTERVIEW_SESSION_REPOSITORY)
    private readonly sessionRepository: IInterviewSessionRepository,
    @Inject(JOB_PROFILES_ACL)
    private readonly jobProfilesACL: IJobProfilesACL,
    private readonly scoringService: ScoringService,
    private readonly adaptiveQuestionSelector: AdaptiveQuestionSelectorService,
    private readonly feedbackGenerator: FeedbackGeneratorService,
  ) {}

  async execute(command: SubmitAnswerCommand): Promise<SubmitAnswerResultDto> {
    // Step 1: Validate session exists and belongs to user
    const sessionId = SessionId.create(command.sessionId);
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException("Interview session not found");
    }

    if (!session.belongsToUser(command.userId)) {
      throw new ForbiddenException(
        "You do not have access to this interview session",
      );
    }

    // Step 2: Validate session status is 'in_progress'
    if (!session.isInProgress()) {
      throw new BadRequestException("Interview session is not in progress");
    }

    // Step 3: Validate questionId matches current question
    const currentQuestion = session.getCurrentQuestion();
    if (!currentQuestion || currentQuestion.id !== command.questionId) {
      throw new BadRequestException(
        "Question ID does not match the current question",
      );
    }

    // Step 4: Load job profile for scoring context
    const jobProfile = await this.jobProfilesACL.getJobProfileInfo(
      session.getJobProfileId(),
    );

    if (!jobProfile) {
      throw new NotFoundException("Job profile not found");
    }

    // Step 5: Score answer
    const jobCompetencies = jobProfile.competencies.map((c) => c.name);
    const interviewType = session.getInterviewType().getValue();
    const scores = this.scoringService.scoreAnswer(
      command.answerText,
      currentQuestion.category,
      interviewType,
      jobCompetencies,
    );

    // Step 6: Update session state with answer and scores
    session.submitAnswer(
      command.questionId,
      command.answerText,
      command.durationSeconds,
      scores,
    );

    // Step 7: Select next question
    const nextQuestionData =
      await this.adaptiveQuestionSelector.selectNextQuestion(
        session,
        jobProfile.competencies,
        jobProfile.interviewDifficultyLevel,
        interviewType,
      );

    // Add next question to session if available
    if (nextQuestionData) {
      session.addQuestion(nextQuestionData);
    }

    // Step 8: Save updated session
    await this.sessionRepository.save(session);

    // Step 9: Generate feedback if score < 50
    const overallScore = scores.calculateOverallScore();
    const feedback = this.feedbackGenerator.generateFeedback(
      scores,
      interviewType,
    );

    // Step 10: Build response
    const scoringDto: AnswerScoringDto = {
      clarity: scores.getClarity(),
      completeness: scores.getCompleteness(),
      confidence: scores.getConfidence(),
      relevance: scores.getRelevance(),
    };

    const question: QuestionDto | undefined = nextQuestionData
      ? {
          category: nextQuestionData.category,
          difficulty: nextQuestionData.difficulty,
          id: nextQuestionData.id,
          text: nextQuestionData.text,
        }
      : undefined;

    return {
      feedback: feedback || undefined,
      overall_score: overallScore,
      question,
      scoring: scoringDto,
      sessionProgress: session.getProgress(),
      timeRemaining: session.getTimeRemaining(),
    };
  }
}
