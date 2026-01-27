import { Competency } from "./competency.entity";

describe("Competency Entity", () => {
  describe("create", () => {
    it("should create a valid competency", () => {
      const competency = Competency.create({
        name: "System Design",
        weight: 0.5,
        depth: 7,
      });

      expect(competency).toBeDefined();
      expect(competency.getName()).toBe("System Design");
      expect(competency.getWeight()).toBe(0.5);
      expect(competency.getDepth()).toBe(7);
    });

    it("should accept weight at boundaries (0 and 1)", () => {
      const comp1 = Competency.create({
        name: "Test",
        weight: 0,
        depth: 5,
      });
      expect(comp1.getWeight()).toBe(0);

      const comp2 = Competency.create({
        name: "Test",
        weight: 1,
        depth: 5,
      });
      expect(comp2.getWeight()).toBe(1);
    });

    it("should accept depth at boundaries (1 and 10)", () => {
      const comp1 = Competency.create({
        name: "Test",
        weight: 0.5,
        depth: 1,
      });
      expect(comp1.getDepth()).toBe(1);

      const comp2 = Competency.create({
        name: "Test",
        weight: 0.5,
        depth: 10,
      });
      expect(comp2.getDepth()).toBe(10);
    });
  });

  describe("validation", () => {
    it("should throw error when name is empty", () => {
      expect(() => {
        Competency.create({
          name: "",
          weight: 0.5,
          depth: 5,
        });
      }).toThrow("Competency name cannot be empty");
    });

    it("should throw error when name is whitespace only", () => {
      expect(() => {
        Competency.create({
          name: "   ",
          weight: 0.5,
          depth: 5,
        });
      }).toThrow("Competency name cannot be empty");
    });

    it("should throw error when weight is below 0", () => {
      expect(() => {
        Competency.create({
          name: "Test",
          weight: -0.1,
          depth: 5,
        });
      }).toThrow("Competency weight must be between 0 and 1");
    });

    it("should throw error when weight is above 1", () => {
      expect(() => {
        Competency.create({
          name: "Test",
          weight: 1.1,
          depth: 5,
        });
      }).toThrow("Competency weight must be between 0 and 1");
    });

    it("should throw error when depth is below 1", () => {
      expect(() => {
        Competency.create({
          name: "Test",
          weight: 0.5,
          depth: 0,
        });
      }).toThrow("Competency depth must be between 1 and 10");
    });

    it("should throw error when depth is above 10", () => {
      expect(() => {
        Competency.create({
          name: "Test",
          weight: 0.5,
          depth: 11,
        });
      }).toThrow("Competency depth must be between 1 and 10");
    });
  });

  describe("toPlainObject", () => {
    it("should convert to plain object", () => {
      const competency = Competency.create({
        name: "System Design",
        weight: 0.5,
        depth: 7,
      });

      const plain = competency.toPlainObject();

      expect(plain).toEqual({
        name: "System Design",
        weight: 0.5,
        depth: 7,
      });
    });
  });
});
