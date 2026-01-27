import { UserId } from "./user-id";

describe("UserId Value Object", () => {
  describe("create", () => {
    it("should create a valid UserId", () => {
      const id = UserId.create("user-123");

      expect(id).toBeDefined();
      expect(id.getValue()).toBe("user-123");
    });

    it("should throw error when value is empty", () => {
      expect(() => {
        UserId.create("");
      }).toThrow("UserId cannot be empty");
    });

    it("should throw error when value is whitespace only", () => {
      expect(() => {
        UserId.create("   ");
      }).toThrow("UserId cannot be empty");
    });
  });

  describe("getValue", () => {
    it("should return the underlying value", () => {
      const id = UserId.create("user-456");

      expect(id.getValue()).toBe("user-456");
    });
  });
});
