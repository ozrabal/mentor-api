import { SeniorityLevel } from "./seniority-level";

describe("SeniorityLevel Value Object", () => {
  describe("create", () => {
    it("should create a valid SeniorityLevel", () => {
      const level = SeniorityLevel.create(5);

      expect(level).toBeDefined();
      expect(level.getValue()).toBe(5);
    });

    it("should accept value at lower boundary (1)", () => {
      const level = SeniorityLevel.create(1);

      expect(level.getValue()).toBe(1);
    });

    it("should accept value at upper boundary (10)", () => {
      const level = SeniorityLevel.create(10);

      expect(level.getValue()).toBe(10);
    });
  });

  describe("validation", () => {
    it("should throw error when value is below 1", () => {
      expect(() => {
        SeniorityLevel.create(0);
      }).toThrow("SeniorityLevel must be between 1 and 10");
    });

    it("should throw error when value is above 10", () => {
      expect(() => {
        SeniorityLevel.create(11);
      }).toThrow("SeniorityLevel must be between 1 and 10");
    });

    it("should throw error when value is negative", () => {
      expect(() => {
        SeniorityLevel.create(-5);
      }).toThrow("SeniorityLevel must be between 1 and 10");
    });
  });

  describe("getValue", () => {
    it("should return the underlying value", () => {
      const level = SeniorityLevel.create(7);

      expect(level.getValue()).toBe(7);
    });
  });
});
