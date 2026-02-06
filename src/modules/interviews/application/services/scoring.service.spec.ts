import { Test, TestingModule } from "@nestjs/testing";

import { ScoringService } from "./scoring.service";

describe("ScoringService", () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("scoreAnswer", () => {
    it("should score a high-quality behavioral answer highly", () => {
      const answer = `
        When I was working at TechCorp, we had a situation where our API was experiencing severe performance issues.
        My task was to identify the bottleneck and resolve it within 24 hours to prevent customer churn.
        I analyzed the logs, profiled the database queries, and discovered that a missing index was causing full table scans.
        I implemented the index and added caching, which resulted in an 80% reduction in response time and prevented any customer losses.
      `;

      const scores = service.scoreAnswer(
        answer,
        "Problem Solving",
        "behavioral",
        ["Problem Solving", "Technical Skills"],
      );

      expect(scores.getClarity()).toBeGreaterThan(6);
      expect(scores.getCompleteness()).toBeGreaterThan(7);
      expect(scores.getRelevance()).toBeGreaterThan(5);
      expect(scores.getConfidence()).toBeGreaterThan(6);
      expect(scores.calculateOverallScore()).toBeGreaterThan(60);
    });

    it("should score a short, vague answer lowly", () => {
      const answer = "I just fixed it.";

      const scores = service.scoreAnswer(
        answer,
        "Problem Solving",
        "behavioral",
        ["Problem Solving"],
      );

      expect(scores.getClarity()).toBeLessThan(5);
      expect(scores.getCompleteness()).toBeLessThan(5);
      // Confidence has a base score of 2, so short answers still get some points
      expect(scores.getConfidence()).toBeLessThanOrEqual(7);
      expect(scores.calculateOverallScore()).toBeLessThan(50);
    });

    it("should score a technical answer with proper depth", () => {
      const answer = `
        The problem was scalability of our microservices architecture.
        My approach was to implement a message queue using Kafka to decouple services.
        The trade-offs were increased complexity vs improved throughput.
        This solution is scalable and has proven efficient in production with 10x traffic increase.
      `;

      const scores = service.scoreAnswer(answer, "System Design", "technical", [
        "System Design",
        "Scalability",
      ]);

      expect(scores.getClarity()).toBeGreaterThan(5);
      expect(scores.getCompleteness()).toBeGreaterThan(7);
      expect(scores.getRelevance()).toBeGreaterThan(5);
      expect(scores.calculateOverallScore()).toBeGreaterThan(50);
    });

    it("should detect STAR format keywords and score clarity higher", () => {
      const answerWithStar = `
        The situation was a critical production incident.
        My task was to restore service within one hour.
        I took action by rolling back the deployment and applying a hotfix.
        The result was zero downtime and full service restoration.
      `;

      const answerWithoutStar = "I fixed the production issue quickly.";

      const scoresWithStar = service.scoreAnswer(
        answerWithStar,
        "Incident Response",
        "behavioral",
        ["Incident Response"],
      );
      const scoresWithoutStar = service.scoreAnswer(
        answerWithoutStar,
        "Incident Response",
        "behavioral",
        ["Incident Response"],
      );

      expect(scoresWithStar.getClarity()).toBeGreaterThan(
        scoresWithoutStar.getClarity(),
      );
      expect(scoresWithStar.getCompleteness()).toBeGreaterThan(
        scoresWithoutStar.getCompleteness(),
      );
    });

    it("should score relevance higher when answer mentions job competencies", () => {
      const relevantAnswer = `
        I led the team through agile transformation, implementing scrum practices.
        We used CI/CD pipelines with Docker and deployed to AWS cloud infrastructure.
      `;

      const irrelevantAnswer = "I worked on some projects and got things done.";

      const relevantScores = service.scoreAnswer(
        relevantAnswer,
        "Leadership",
        "behavioral",
        ["Leadership", "Agile", "Cloud", "DevOps"],
      );
      const irrelevantScores = service.scoreAnswer(
        irrelevantAnswer,
        "Leadership",
        "behavioral",
        ["Leadership", "Agile", "Cloud", "DevOps"],
      );

      expect(relevantScores.getRelevance()).toBeGreaterThan(
        irrelevantScores.getRelevance(),
      );
    });

    it("should penalize answers with filler words", () => {
      const answerWithFillers = `
        Um, so like, I basically, you know, worked on the project.
        It was, sort of, kind of difficult but I actually finished it.
      `;

      const answerWithoutFillers = `
        I worked on the project diligently.
        Despite challenges, I completed it successfully ahead of schedule.
      `;

      const scoresWithFillers = service.scoreAnswer(
        answerWithFillers,
        "Project Management",
        "behavioral",
        ["Project Management"],
      );
      const scoresWithoutFillers = service.scoreAnswer(
        answerWithoutFillers,
        "Project Management",
        "behavioral",
        ["Project Management"],
      );

      expect(scoresWithoutFillers.getConfidence()).toBeGreaterThan(
        scoresWithFillers.getConfidence(),
      );
    });

    it("should score completeness higher for behavioral answers with STAR elements", () => {
      const answer = `
        The situation was our team facing a tight deadline.
        My task was to coordinate five developers across different time zones.
        I implemented daily standups and created a shared Kanban board.
        As a result, we delivered the project two days early with zero defects.
      `;

      const scores = service.scoreAnswer(
        answer,
        "Team Leadership",
        "behavioral",
        ["Leadership", "Communication"],
      );

      expect(scores.getCompleteness()).toBeGreaterThanOrEqual(7.5);
    });

    it("should score completeness higher for technical answers with all elements", () => {
      const answer = `
        The problem was handling high-frequency data streams.
        My approach was to use event sourcing with Redis streams.
        The trade-offs included eventual consistency vs real-time guarantees.
        The solution proved scalable and efficient under load testing.
      `;

      const scores = service.scoreAnswer(
        answer,
        "System Architecture",
        "technical",
        ["Architecture", "Scalability"],
      );

      expect(scores.getCompleteness()).toBeGreaterThanOrEqual(7.5);
    });

    it("should score concise answers (50-200 words) higher in clarity", () => {
      const conciseAnswer = `
        I led a team of five engineers to migrate our monolith to microservices.
        We planned the decomposition strategy, identified bounded contexts, and executed in phases.
        The migration took six months and resulted in improved deployment frequency and system reliability.
        We achieved 99.9% uptime and reduced deployment time from hours to minutes.
      `.repeat(2); // Around 100 words

      const veryShortAnswer = "I did it.";

      const veryLongAnswer = `
        I led a team of five engineers to migrate our monolith to microservices.
      `.repeat(100); // Too long

      const conciseScores = service.scoreAnswer(
        conciseAnswer,
        "Migration",
        "technical",
        ["Migration"],
      );
      const shortScores = service.scoreAnswer(
        veryShortAnswer,
        "Migration",
        "technical",
        ["Migration"],
      );
      const longScores = service.scoreAnswer(
        veryLongAnswer,
        "Migration",
        "technical",
        ["Migration"],
      );

      expect(conciseScores.getClarity()).toBeGreaterThan(
        shortScores.getClarity(),
      );
      expect(conciseScores.getClarity()).toBeGreaterThanOrEqual(
        longScores.getClarity(),
      );
    });

    it("should return scores within valid range (0-10)", () => {
      const answers = [
        "I fixed it.",
        "I worked on the project and completed it successfully with my team.",
        `
          When faced with the situation of a critical production outage, my task was to restore service immediately.
          I took action by diagnosing the root cause, implementing a fix, and deploying to production.
          The result was full service restoration within 30 minutes with zero data loss.
        `,
      ];

      answers.forEach((answer) => {
        const scores = service.scoreAnswer(
          answer,
          "Problem Solving",
          "behavioral",
          ["Problem Solving"],
        );

        expect(scores.getClarity()).toBeGreaterThanOrEqual(0);
        expect(scores.getClarity()).toBeLessThanOrEqual(10);
        expect(scores.getCompleteness()).toBeGreaterThanOrEqual(0);
        expect(scores.getCompleteness()).toBeLessThanOrEqual(10);
        expect(scores.getRelevance()).toBeGreaterThanOrEqual(0);
        expect(scores.getRelevance()).toBeLessThanOrEqual(10);
        expect(scores.getConfidence()).toBeGreaterThanOrEqual(0);
        expect(scores.getConfidence()).toBeLessThanOrEqual(10);
        expect(scores.calculateOverallScore()).toBeGreaterThanOrEqual(0);
        expect(scores.calculateOverallScore()).toBeLessThanOrEqual(100);
      });
    });

    it("should score vocabulary richness in clarity", () => {
      const diverseVocabulary = `
        I orchestrated the architectural transformation, leveraging microservices patterns.
        We implemented domain-driven design principles, ensuring bounded contexts were properly defined.
        The modernization initiative yielded significant improvements in system maintainability.
      `;

      const repetitiveVocabulary = `
        I worked on the thing and worked with the team to work on the work.
        We worked together and worked hard to work on the work that needed work.
      `;

      const diverseScores = service.scoreAnswer(
        diverseVocabulary,
        "Architecture",
        "technical",
        ["Architecture"],
      );
      const repetitiveScores = service.scoreAnswer(
        repetitiveVocabulary,
        "Architecture",
        "technical",
        ["Architecture"],
      );

      expect(diverseScores.getClarity()).toBeGreaterThan(
        repetitiveScores.getClarity(),
      );
    });

    it("should handle edge case of empty or very short answers", () => {
      const emptyAnswer = "";
      const oneWordAnswer = "Yes";

      const emptyScores = service.scoreAnswer(
        emptyAnswer,
        "Question",
        "behavioral",
        ["Competency"],
      );
      const oneWordScores = service.scoreAnswer(
        oneWordAnswer,
        "Question",
        "behavioral",
        ["Competency"],
      );

      expect(emptyScores.calculateOverallScore()).toBeLessThan(30);
      expect(oneWordScores.calculateOverallScore()).toBeLessThan(30);
    });

    it("should score role understanding keywords in relevance", () => {
      const answerWithRoleKeywords = `
        I collaborated with cross-functional teams including product managers and stakeholders.
        Taking ownership of the customer experience, I mentored junior developers.
        We focused on business value and user needs throughout the project.
      `;

      const answerWithoutRoleKeywords = `
        I wrote code and fixed bugs in the application.
      `;

      const withKeywordsScores = service.scoreAnswer(
        answerWithRoleKeywords,
        "Leadership",
        "behavioral",
        ["Leadership"],
      );
      const withoutKeywordsScores = service.scoreAnswer(
        answerWithoutRoleKeywords,
        "Leadership",
        "behavioral",
        ["Leadership"],
      );

      expect(withKeywordsScores.getRelevance()).toBeGreaterThan(
        withoutKeywordsScores.getRelevance(),
      );
    });
  });
});
