import { expect } from "vitest";
import { ZodError, ZodSchema } from "zod";

export function assertValidationPasses<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  expect(result.success).toBe(true);
  return result.data as T;
}

export function assertValidationFails<T>(
  schema: ZodSchema<T>,
  data: unknown,
  expectedErrorCount?: number,
): ZodError {
  const result = schema.safeParse(data);
  expect(result.success).toBe(false);
  if (expectedErrorCount !== undefined && !result.success) {
    expect(result.error.issues.length).toBe(expectedErrorCount);
  }
  return (result as { success: false; error: ZodError }).error;
}

export function assertFieldError(
  error: ZodError,
  fieldPath: string,
  expectedMessage?: string,
) {
  const issue = error.issues.find((i) => i.path.join(".") === fieldPath);
  expect(issue).toBeDefined();
  if (expectedMessage && issue) {
    expect(issue.message).toBe(expectedMessage);
  }
}

export function assertRequiredFieldError(error: ZodError, field: string) {
  assertFieldError(error, field, "Required");
}

export function assertMinLengthError(error: ZodError, field: string, min: number) {
  const issue = error.issues.find((i) => i.path.join(".") === field);
  expect(issue).toBeDefined();
  expect(issue?.message).toContain(`${min}`);
}

export function assertMaxLengthError(error: ZodError, field: string, max: number) {
  const issue = error.issues.find((i) => i.path.join(".") === field);
  expect(issue).toBeDefined();
  expect(issue?.message).toContain(`${max}`);
}

export function assertEmailFormatError(error: ZodError, field: string = "email") {
  assertFieldError(error, field, "Invalid email");
}

export function assertUrlFormatError(error: ZodError, field: string) {
  assertFieldError(error, field, "Invalid URL");
}

export function assertNumberTypeError(error: ZodError, field: string) {
  assertFieldError(error, field, "Expected number");
}
