import { describe, it, expect, vi, beforeEach } from "vitest";

interface AuthResult {
  authenticated: boolean;
  user?: { id: string; email: string; role: string };
  error?: string;
}

interface Session {
  user: { id: string; email: string; role: string; name?: string };
  expires: string;
}

const mockAuth = vi.fn<() => Promise<Session | null>>();
vi.mock("@/auth", () => ({ auth: mockAuth }));

function requireAuth(): Promise<AuthResult>;
function requireAuth(roles: string[]): Promise<AuthResult>;
async function requireAuth(roles?: string[]): Promise<AuthResult> {
  const session = await mockAuth();

  if (!session) {
    return { authenticated: false, error: "Authentication required" };
  }

  if (roles && roles.length > 0 && !roles.includes(session.user.role)) {
    if (session.user.role === "SUPER_ADMIN") {
      return { authenticated: true, user: session.user };
    }
    return { authenticated: false, error: "Insufficient permissions" };
  }

  return { authenticated: true, user: session.user };
}

function createSession(overrides?: Partial<Session["user"]>): Session {
  return {
    user: {
      id: "user-1",
      email: "admin@test.com",
      role: "ADMIN",
      name: "Admin User",
      ...overrides,
    },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

describe("Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireAuth", () => {
    it("returns authenticated when session exists", async () => {
      mockAuth.mockResolvedValue(createSession());
      const result = await requireAuth();
      expect(result.authenticated).toBe(true);
      expect(result.user?.email).toBe("admin@test.com");
    });

    it("returns unauthenticated when no session", async () => {
      mockAuth.mockResolvedValue(null);
      const result = await requireAuth();
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe("Authentication required");
    });

    it("returns authorized for matching role", async () => {
      mockAuth.mockResolvedValue(createSession({ role: "ADMIN" }));
      const result = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
      expect(result.authenticated).toBe(true);
    });

    it("returns unauthorized for wrong role", async () => {
      mockAuth.mockResolvedValue(createSession({ role: "EDITOR" }));
      const result = await requireAuth(["ADMIN", "SUPER_ADMIN"]);
      expect(result.authenticated).toBe(false);
      expect(result.error).toBe("Insufficient permissions");
    });

    it("returns authorized when no roles restriction", async () => {
      mockAuth.mockResolvedValue(createSession({ role: "SUPER_ADMIN" }));
      const result = await requireAuth();
      expect(result.authenticated).toBe(true);
    });

    it("returns authorized for SUPER_ADMIN regardless of required roles", async () => {
      mockAuth.mockResolvedValue(createSession({ role: "SUPER_ADMIN" }));
      const result = await requireAuth(["MANAGER", "EDITOR"]);
      expect(result.authenticated).toBe(true);
    });
  });
});
