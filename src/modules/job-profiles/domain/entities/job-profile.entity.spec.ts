import { JobProfile } from "./job-profile.entity";
import { UserId } from "../value-objects/user-id";
import { SeniorityLevel } from "../value-objects/seniority-level";
import { Competency } from "./competency.entity";
import { JobProfileId } from "../value-objects/job-profile-id";

describe("JobProfile Entity", () => {
  describe("createNew", () => {
    it("should create a new job profile with required fields", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        jobTitle: "Senior Software Engineer",
        rawJD: "We are looking for...",
      });

      expect(profile).toBeDefined();
      expect(profile.getId()).toBeDefined();
      expect(profile.getUserId().getValue()).toBe("user-123");
      expect(profile.getJobTitle()).toBe("Senior Software Engineer");
      expect(profile.getRawJD()).toBe("We are looking for...");
      expect(profile.getCreatedAt()).toBeDefined();
      expect(profile.getUpdatedAt()).toBeDefined();
      expect(profile.isDeleted()).toBe(false);
    });

    it("should create a new job profile with optional fields", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        jobTitle: "Senior Software Engineer",
        companyName: "Tech Corp",
        jobUrl: "https://example.com/job",
        rawJD: "Job description",
        competencies: [
          Competency.create({ name: "Programming", weight: 0.5, depth: 7 }),
        ],
        softSkills: ["Communication", "Leadership"],
        hardSkills: ["TypeScript", "NestJS"],
        seniorityLevel: SeniorityLevel.create(7),
        interviewDifficultyLevel: 8,
      });

      expect(profile.getCompanyName()).toBe("Tech Corp");
      expect(profile.getJobUrl()).toBe("https://example.com/job");
      expect(profile.getCompetencies()).toHaveLength(1);
      expect(profile.getSoftSkills()).toEqual(["Communication", "Leadership"]);
      expect(profile.getHardSkills()).toEqual(["TypeScript", "NestJS"]);
      expect(profile.getSeniorityLevel()?.getValue()).toBe(7);
      expect(profile.getInterviewDifficultyLevel()).toBe(8);
    });
  });

  describe("rehydrate", () => {
    it("should rehydrate a job profile from persistence", () => {
      const id = JobProfileId.generate();
      const userId = UserId.create("user-123");
      const createdAt = new Date("2026-01-01");
      const updatedAt = new Date("2026-01-02");

      const profile = JobProfile.rehydrate({
        id,
        userId,
        jobTitle: "Engineer",
        companyName: "Company",
        jobUrl: "https://example.com",
        rawJD: "Description",
        competencies: [
          Competency.create({ name: "Programming", weight: 1, depth: 5 }),
        ],
        softSkills: ["Communication"],
        hardSkills: ["TypeScript"],
        seniorityLevel: SeniorityLevel.create(5),
        interviewDifficultyLevel: 6,
        createdAt,
        updatedAt,
        deletedAt: undefined,
      });

      expect(profile.getId()).toBe(id);
      expect(profile.getUserId()).toBe(userId);
      expect(profile.getCreatedAt()).toBe(createdAt);
      expect(profile.getUpdatedAt()).toBe(updatedAt);
    });
  });

  describe("updateParsedData", () => {
    it("should update parsed data", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Original JD",
      });

      const updatedAt = profile.getUpdatedAt();

      // Wait a bit to ensure updatedAt changes
      setTimeout(() => {
        profile.updateParsedData({
          jobTitle: "Updated Title",
          companyName: "New Company",
          seniorityLevel: SeniorityLevel.create(5),
          competencies: [
            Competency.create({ name: "Programming", weight: 1, depth: 5 }),
          ],
          softSkills: ["Leadership"],
          hardSkills: ["Node.js"],
          interviewDifficultyLevel: 7,
        });

        expect(profile.getJobTitle()).toBe("Updated Title");
        expect(profile.getCompanyName()).toBe("New Company");
        expect(profile.getSeniorityLevel()?.getValue()).toBe(5);
        expect(profile.getCompetencies()).toHaveLength(1);
        expect(profile.getSoftSkills()).toEqual(["Leadership"]);
        expect(profile.getHardSkills()).toEqual(["Node.js"]);
        expect(profile.getInterviewDifficultyLevel()).toBe(7);
        expect(profile.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
          updatedAt.getTime(),
        );
      }, 10);
    });

    it("should throw error when updating deleted profile", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
      });

      profile.softDelete();

      expect(() => {
        profile.updateParsedData({
          jobTitle: "Should fail",
        });
      }).toThrow("Cannot update deleted job profile");
    });
  });

  describe("softDelete", () => {
    it("should soft delete a job profile", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
      });

      expect(profile.isDeleted()).toBe(false);
      expect(profile.getDeletedAt()).toBeUndefined();

      profile.softDelete();

      expect(profile.isDeleted()).toBe(true);
      expect(profile.getDeletedAt()).toBeDefined();
    });

    it("should throw error when deleting already deleted profile", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
      });

      profile.softDelete();

      expect(() => {
        profile.softDelete();
      }).toThrow("Job profile is already deleted");
    });
  });

  describe("restore", () => {
    it("should restore a deleted job profile", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
      });

      profile.softDelete();
      expect(profile.isDeleted()).toBe(true);

      profile.restore();
      expect(profile.isDeleted()).toBe(false);
      expect(profile.getDeletedAt()).toBeUndefined();
    });

    it("should throw error when restoring non-deleted profile", () => {
      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
      });

      expect(() => {
        profile.restore();
      }).toThrow("Job profile is not deleted");
    });
  });

  describe("getters", () => {
    it("should return immutable copies of arrays", () => {
      const competencies = [
        Competency.create({ name: "Programming", weight: 1, depth: 5 }),
      ];
      const softSkills = ["Communication"];
      const hardSkills = ["TypeScript"];

      const profile = JobProfile.createNew({
        userId: UserId.create("user-123"),
        rawJD: "Test",
        competencies,
        softSkills,
        hardSkills,
      });

      // Modify returned arrays
      profile
        .getCompetencies()
        .push(Competency.create({ name: "Design", weight: 1, depth: 5 }));
      profile.getSoftSkills().push("Leadership");
      profile.getHardSkills().push("Node.js");

      // Original should remain unchanged
      expect(profile.getCompetencies()).toHaveLength(1);
      expect(profile.getSoftSkills()).toEqual(["Communication"]);
      expect(profile.getHardSkills()).toEqual(["TypeScript"]);
    });
  });
});
