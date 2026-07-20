import { describe, it, expect, vi } from "vitest";

class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with ID ${id}` : ""} not found`,
      404,
      "NOT_FOUND",
    );
    this.name = "NotFoundError";
  }
}

class ValidationError extends AppError {
  constructor(message: string, public fieldErrors?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR", fieldErrors);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthenticationError";
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
    this.name = "AuthorizationError";
  }
}

class RateLimitError extends AppError {
  constructor(retryAfterMs: number) {
    super("Too many requests", 429, "RATE_LIMITED", { retryAfterMs });
    this.name = "RateLimitError";
  }
}

function handleApiError(error: unknown): { status: number; body: Record<string, unknown> } {
  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: { error: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    };
  }

  return { status: 500, body: { error: "INTERNAL_ERROR", message: "An unexpected error occurred" } };
}

function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    switch (error.statusCode) {
      case 400: return "Please check your input and try again.";
      case 401: return "Please sign in to continue.";
      case 403: return "You don't have permission to perform this action.";
      case 404: return "The requested resource was not found.";
      case 409: return "This conflicts with existing data.";
      case 422: return "Please fix the validation errors.";
      case 429: return "Too many requests. Please wait and try again.";
      case 500: return "Something went wrong. Please try again later.";
      default: return error.message;
    }
  }
  return "Something went wrong. Please try again later.";
}

describe("Error Handling", () => {
  describe("Error Classes", () => {
    it("NotFoundError has correct status", () => {
      const err = new NotFoundError("Invoice", "inv-1");
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe("NOT_FOUND");
    });

    it("ValidationError has field errors", () => {
      const err = new ValidationError("Invalid input", { name: ["Name is required"], email: ["Invalid email"] });
      expect(err.statusCode).toBe(422);
      expect(err.details).toEqual({ name: ["Name is required"], email: ["Invalid email"] });
    });

    it("AuthenticationError has correct status", () => {
      const err = new AuthenticationError();
      expect(err.statusCode).toBe(401);
      expect(err.code).toBe("UNAUTHORIZED");
    });

    it("AuthorizationError has correct status", () => {
      const err = new AuthorizationError();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FORBIDDEN");
    });

    it("RateLimitError includes retry info", () => {
      const err = new RateLimitError(60000);
      expect(err.statusCode).toBe(429);
      expect(err.details).toEqual({ retryAfterMs: 60000 });
    });
  });

  describe("handleApiError", () => {
    it("returns proper response for AppError", () => {
      const error = new NotFoundError("Invoice");
      const response = handleApiError(error);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("NOT_FOUND");
    });

    it("returns 500 for unknown errors", () => {
      const response = handleApiError(new Error("Something broke"));
      expect(response.status).toBe(500);
    });

    it("returns 500 for non-Error throws", () => {
      const response = handleApiError("string error");
      expect(response.status).toBe(500);
    });
  });

  describe("getUserFriendlyMessage", () => {
    it("returns friendly auth message", () => {
      expect(getUserFriendlyMessage(new AuthenticationError())).toBe("Please sign in to continue.");
    });

    it("returns friendly 404 message", () => {
      expect(getUserFriendlyMessage(new NotFoundError("Page"))).toBe("The requested resource was not found.");
    });

    it("returns friendly rate limit message", () => {
      expect(getUserFriendlyMessage(new RateLimitError(30000))).toBe("Too many requests. Please wait and try again.");
    });

    it("returns default for unknown errors", () => {
      expect(getUserFriendlyMessage(new Error("random"))).toBe("Something went wrong. Please try again later.");
    });
  });
});
