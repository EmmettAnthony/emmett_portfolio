import { describe, it, expect } from "vitest";

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SUPPORT" | "EDITOR" | "CLIENT" | "GUEST";

interface ResourcePolicy {
  resource: string;
  actions: string[];
  roles: Role[];
}

const RESOURCE_POLICIES: ResourcePolicy[] = [
  { resource: "users", actions: ["create", "read", "update", "delete"], roles: ["SUPER_ADMIN"] },
  { resource: "users", actions: ["read"], roles: ["ADMIN"] },
  { resource: "invoices", actions: ["create", "read", "update"], roles: ["ADMIN", "MANAGER"] },
  { resource: "invoices", actions: ["delete", "refund"], roles: ["SUPER_ADMIN", "ADMIN"] },
  { resource: "invoices", actions: ["read"], roles: ["ACCOUNTANT", "EDITOR", "CLIENT"] },
  { resource: "payments", actions: ["process", "refund"], roles: ["SUPER_ADMIN", "ACCOUNTANT"] },
  { resource: "payments", actions: ["read"], roles: ["ADMIN", "MANAGER", "SUPPORT", "EDITOR", "CLIENT"] },
  { resource: "reports", actions: ["read", "export"], roles: ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"] },
  { resource: "reports", actions: ["read"], roles: ["MANAGER"] },
  { resource: "settings", actions: ["read", "update"], roles: ["SUPER_ADMIN"] },
  { resource: "settings", actions: ["read"], roles: ["ADMIN", "ACCOUNTANT"] },
  { resource: "support", actions: ["manage", "reply", "read"], roles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] },
  { resource: "support", actions: ["reply", "read"], roles: ["CLIENT"] },
  { resource: "crm", actions: ["manage", "read"], roles: ["SUPER_ADMIN", "ADMIN"] },
  { resource: "crm", actions: ["read"], roles: ["MANAGER", "SUPPORT"] },
  { resource: "bookings", actions: ["manage", "read"], roles: ["SUPER_ADMIN", "ADMIN"] },
  { resource: "bookings", actions: ["read"], roles: ["MANAGER", "SUPPORT", "CLIENT"] },
  { resource: "email", actions: ["send", "templates"], roles: ["SUPER_ADMIN", "ADMIN"] },
];

function checkPermission(role: Role, resource: string, action: string): boolean {
  return RESOURCE_POLICIES.some(
    (policy) => policy.resource === resource && policy.actions.includes(action) && policy.roles.includes(role),
  );
}

function getAllowedResources(role: Role): { resource: string; actions: string[] }[] {
  const allowed: Record<string, Set<string>> = {};
  for (const policy of RESOURCE_POLICIES) {
    if (policy.roles.includes(role)) {
      if (!allowed[policy.resource]) allowed[policy.resource] = new Set();
      for (const action of policy.actions) {
        allowed[policy.resource].add(action);
      }
    }
  }
  return Object.entries(allowed).map(([resource, actions]) => ({
    resource,
    actions: Array.from(actions),
  }));
}

describe("Authorization", () => {
  describe("checkPermission", () => {
    it("SUPER_ADMIN can manage all resources", () => {
      expect(checkPermission("SUPER_ADMIN", "users", "delete")).toBe(true);
      expect(checkPermission("SUPER_ADMIN", "settings", "update")).toBe(true);
      expect(checkPermission("SUPER_ADMIN", "payments", "refund")).toBe(true);
    });

    it("ADMIN can manage invoices but not users", () => {
      expect(checkPermission("ADMIN", "invoices", "create")).toBe(true);
      expect(checkPermission("ADMIN", "invoices", "delete")).toBe(true);
      expect(checkPermission("ADMIN", "users", "create")).toBe(false);
      expect(checkPermission("ADMIN", "users", "delete")).toBe(false);
    });

    it("MANAGER can create invoices but not refund payments", () => {
      expect(checkPermission("MANAGER", "invoices", "create")).toBe(true);
      expect(checkPermission("MANAGER", "payments", "process")).toBe(false);
      expect(checkPermission("MANAGER", "payments", "refund")).toBe(false);
    });

    it("ACCOUNTANT can process and refund payments", () => {
      expect(checkPermission("ACCOUNTANT", "payments", "process")).toBe(true);
      expect(checkPermission("ACCOUNTANT", "payments", "refund")).toBe(true);
      expect(checkPermission("ACCOUNTANT", "users", "manage")).toBe(false);
    });

    it("SUPPORT can manage support tickets only", () => {
      expect(checkPermission("SUPPORT", "support", "manage")).toBe(true);
      expect(checkPermission("SUPPORT", "invoices", "create")).toBe(false);
      expect(checkPermission("SUPPORT", "payments", "process")).toBe(false);
    });

    it("EDITOR has read-only access", () => {
      expect(checkPermission("EDITOR", "invoices", "read")).toBe(true);
      expect(checkPermission("EDITOR", "invoices", "create")).toBe(false);
      expect(checkPermission("EDITOR", "payments", "read")).toBe(true);
    });

    it("CLIENT has limited access", () => {
      expect(checkPermission("CLIENT", "invoices", "read")).toBe(true);
      expect(checkPermission("CLIENT", "support", "reply")).toBe(true);
      expect(checkPermission("CLIENT", "settings", "read")).toBe(false);
      expect(checkPermission("CLIENT", "users", "read")).toBe(false);
    });

    it("GUEST has no access", () => {
      expect(checkPermission("GUEST", "invoices", "read")).toBe(false);
      expect(checkPermission("GUEST", "support", "read")).toBe(false);
    });
  });

  describe("getAllowedResources", () => {
    it("returns full access for SUPER_ADMIN", () => {
      const resources = getAllowedResources("SUPER_ADMIN");
      expect(resources.length).toBeGreaterThan(5);
      expect(resources.find((r) => r.resource === "users")?.actions).toContain("delete");
    });

    it("returns limited resources for CLIENT", () => {
      const resources = getAllowedResources("CLIENT");
      expect(resources.length).toBeGreaterThan(0);
      expect(resources.length).toBeLessThan(8);
      expect(resources.find((r) => r.resource === "settings")).toBeUndefined();
    });

    it("returns empty for GUEST", () => {
      const resources = getAllowedResources("GUEST");
      expect(resources).toHaveLength(0);
    });
  });
});
