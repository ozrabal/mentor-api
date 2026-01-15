/**
 * Register Request DTO Validation Tests
 */

import { validate } from "class-validator";

import { RegisterRequestDto } from "./register-request.dto";

describe("RegisterRequestDto", () => {
  it("should be valid with proper email and password", async () => {
    const dto: RegisterRequestDto = {
      email: "new@example.com",
      password: "SecurePass123",
    };

    const errors = await validate(Object.assign(new RegisterRequestDto(), dto));
    expect(errors).toHaveLength(0);
  });

  it("should be invalid with bad email", async () => {
    const dto: RegisterRequestDto = {
      email: "nope",
      password: "SecurePass123",
    } as any;

    const errors = await validate(Object.assign(new RegisterRequestDto(), dto));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "email")).toBe(true);
  });

  it("should be invalid with short password", async () => {
    const dto: RegisterRequestDto = {
      email: "new@example.com",
      password: "123",
    };

    const errors = await validate(Object.assign(new RegisterRequestDto(), dto));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "password")).toBe(true);
  });
});
