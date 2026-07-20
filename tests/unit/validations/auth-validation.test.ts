import { describe, it, expect } from "vitest";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number"),
});

type LoginInput = z.infer<typeof loginSchema>;
type RegisterInput = z.infer<typeof registerSchema>;

describe("Authentication Validation", () => {
  describe("Login Schema", () => {
    it("passes with valid credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("fails with invalid email", () => {
      const result = loginSchema.safeParse({
        email: "invalid",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("fails with empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("fails with missing fields", () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Register Schema", () => {
    it("passes with valid registration data", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass1",
        confirmPassword: "SecurePass1",
      });
      expect(result.success).toBe(true);
    });

    it("fails when passwords do not match", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "SecurePass1",
        confirmPassword: "DifferentPass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("confirmPassword");
      }
    });

    it("fails with weak password (no uppercase)", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "weakpassword1",
        confirmPassword: "weakpassword1",
      });
      expect(result.success).toBe(false);
    });

    it("fails with weak password (no number)", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "WeakPassword",
        confirmPassword: "WeakPassword",
      });
      expect(result.success).toBe(false);
    });

    it("fails with short password", () => {
      const result = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "Ab1",
        confirmPassword: "Ab1",
      });
      expect(result.success).toBe(false);
    });

    it("fails with name too short", () => {
      const result = registerSchema.safeParse({
        name: "J",
        email: "john@example.com",
        password: "SecurePass1",
        confirmPassword: "SecurePass1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Password Reset Schema", () => {
    it("passes with valid reset data", () => {
      const result = passwordResetSchema.safeParse({
        token: "valid-reset-token-123",
        password: "NewSecure1",
      });
      expect(result.success).toBe(true);
    });

    it("fails with empty token", () => {
      const result = passwordResetSchema.safeParse({
        token: "",
        password: "NewSecure1",
      });
      expect(result.success).toBe(false);
    });

    it("fails with weak new password", () => {
      const result = passwordResetSchema.safeParse({
        token: "token-123",
        password: "weak",
      });
      expect(result.success).toBe(false);
    });
  });
});
