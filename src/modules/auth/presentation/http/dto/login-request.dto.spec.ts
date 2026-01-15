/**
 * Login Request DTO Validation Tests
 */

import { validate } from "class-validator";

import { LoginRequestDto } from "./login-request.dto";

describe("LoginRequestDto", () => {
  it("should be valid with proper email and password", async () => {
    const dto: LoginRequestDto = {
      email: "user@example.com",
      password: "SecurePass123",
    };

    const errors = await validate(Object.assign(new LoginRequestDto(), dto));
    expect(errors).toHaveLength(0);
  });

  it("should be invalid with bad email", async () => {
    const dto: LoginRequestDto = {
      email: "not-an-email",
      password: "SecurePass123",
    };

    const errors = await validate(Object.assign(new LoginRequestDto(), dto));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "email")).toBe(true);
  });

  it("should be invalid with short password", async () => {
    const dto: LoginRequestDto = {
      email: "user@example.com",
      password: "123",
    };

    const errors = await validate(Object.assign(new LoginRequestDto(), dto));
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === "password")).toBe(true);
  });
});
