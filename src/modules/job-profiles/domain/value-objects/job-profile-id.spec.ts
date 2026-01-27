import { JobProfileId } from "./job-profile-id";

describe("JobProfileId Value Object", () => {
  describe("create", () => {
    it("should create a valid JobProfileId", () => {
      const id = JobProfileId.create("valid-id-123");

      expect(id).toBeDefined();
      expect(id.getValue()).toBe("valid-id-123");
    });

    it("should throw error when value is empty", () => {
      expect(() => {
        JobProfileId.create("");
      }).toThrow("JobProfileId cannot be empty");
    });

    it("should throw error when value is whitespace only", () => {
      expect(() => {
        JobProfileId.create("   ");
      }).toThrow("JobProfileId cannot be empty");
    });
  });

  describe("generate", () => {
    it("should generate a new UUID", () => {
      const id = JobProfileId.generate();

      expect(id).toBeDefined();
      expect(id.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should generate unique IDs", () => {
      const id1 = JobProfileId.generate();
      const id2 = JobProfileId.generate();

      expect(id1.getValue()).not.toBe(id2.getValue());
    });
  });

  describe("equals", () => {
    it("should return true for equal IDs", () => {
      const id1 = JobProfileId.create("same-id");
      const id2 = JobProfileId.create("same-id");

      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for different IDs", () => {
      const id1 = JobProfileId.create("id-1");
      const id2 = JobProfileId.create("id-2");

      expect(id1.equals(id2)).toBe(false);
    });
  });
});
