import { describe, it, expect } from "vitest";

type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SUPPORT" | "EDITOR" | "CLIENT" | "GUEST";

type Permission =
  | "users.manage"
  | "users.view"
  | "invoices.create"
  | "invoices.view"
  | "invoices.edit"
  | "invoices.delete"
  | "invoices.refund"
  | "customers.manage"
  | "customers.view"
  | "payments.process"
  | "payments.refund"
  | "payments.view"
  | "reports.view"
  | "reports.export"
  | "settings.manage"
  | "settings.view"
  | "support.manage"
  | "support.reply"
  | "support.view"
  | "crm.manage"
  | "crm.view"
  | "email.send"
  | "email.templates"
  | "bookings.manage"
  | "bookings.view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "users.manage", "users.view",
    "invoices.create", "invoices.view", "invoices.edit", "invoices.delete", "invoices.refund",
    "customers.manage", "customers.view",
    "payments.process", "payments.refund", "payments.view",
    "reports.view", "reports.export",
    "settings.manage", "settings.view",
    "support.manage", "support.reply", "support.view",
    "crm.manage", "crm.view",
    "email.send", "email.templates",
    "bookings.manage", "bookings.view",
  ],
  ADMIN: [
    "users.view",
    "invoices.create", "invoices.view", "invoices.edit", "invoices.delete",
    "customers.manage", "customers.view",
    "payments.process", "payments.view",
    "reports.view", "reports.export",
    "settings.view",
    "support.manage", "support.reply", "support.view",
    "crm.manage", "crm.view",
    "email.send", "email.templates",
    "bookings.manage", "bookings.view",
  ],
  MANAGER: [
    "invoices.create", "invoices.view", "invoices.edit",
    "customers.manage", "customers.view",
    "payments.view",
    "reports.view",
    "support.reply", "support.view",
    "crm.view",
    "bookings.view",
  ],
  ACCOUNTANT: [
    "invoices.view", "invoices.edit",
    "customers.view",
    "payments.process", "payments.refund", "payments.view",
    "reports.view", "reports.export",
    "settings.view",
  ],
  SUPPORT: [
    "customers.view",
    "payments.view",
    "support.manage", "support.reply", "support.view",
    "crm.view",
    "bookings.view",
  ],
  EDITOR: [
    "invoices.view",
    "customers.view",
    "payments.view",
    "support.view",
  ],
  CLIENT: [
    "invoices.view",
    "payments.view",
    "support.view", "support.reply",
    "bookings.view",
  ],
  GUEST: [],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

describe("Permission Helpers", () => {
  describe("hasPermission", () => {
    it("grants SUPER_ADMIN all permissions", () => {
      expect(hasPermission("SUPER_ADMIN", "users.manage")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "settings.manage")).toBe(true);
      expect(hasPermission("SUPER_ADMIN", "invoices.refund")).toBe(true);
    });

    it("grants ADMIN invoice management but not user management", () => {
      expect(hasPermission("ADMIN", "invoices.create")).toBe(true);
      expect(hasPermission("ADMIN", "invoices.delete")).toBe(true);
      expect(hasPermission("ADMIN", "users.manage")).toBe(false);
    });

    it("grants MANAGER edit but not delete invoices", () => {
      expect(hasPermission("MANAGER", "invoices.edit")).toBe(true);
      expect(hasPermission("MANAGER", "invoices.delete")).toBe(false);
    });

    it("grants ACCOUNTANT payment processing", () => {
      expect(hasPermission("ACCOUNTANT", "payments.process")).toBe(true);
      expect(hasPermission("ACCOUNTANT", "payments.refund")).toBe(true);
      expect(hasPermission("ACCOUNTANT", "users.manage")).toBe(false);
    });

    it("grants SUPPORT ticket management only", () => {
      expect(hasPermission("SUPPORT", "support.manage")).toBe(true);
      expect(hasPermission("SUPPORT", "invoices.create")).toBe(false);
      expect(hasPermission("SUPPORT", "payments.process")).toBe(false);
    });

    it("grants GUEST no permissions", () => {
      const allPermissions: Permission[] = [
        "users.view", "invoices.view", "customers.view",
        "payments.view", "reports.view", "settings.view",
        "support.view", "crm.view", "bookings.view",
      ];
      for (const p of allPermissions) {
        expect(hasPermission("GUEST", p)).toBe(false);
      }
    });

    it("returns false for unknown role", () => {
      expect(hasPermission("UNKNOWN" as Role, "invoices.view")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when user has at least one permission", () => {
      expect(hasAnyPermission("SUPPORT", ["invoices.create", "support.reply", "settings.manage"])).toBe(true);
    });

    it("returns false when user has none of the permissions", () => {
      expect(hasAnyPermission("EDITOR", ["users.manage", "settings.manage"])).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when user has all permissions", () => {
      expect(hasAllPermissions("ADMIN", ["invoices.view", "invoices.create", "invoices.edit"])).toBe(true);
    });

    it("returns false when user lacks one permission", () => {
      expect(hasAllPermissions("ADMIN", ["invoices.view", "users.manage"])).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("returns all permissions for a role", () => {
      const permissions = getRolePermissions("GUEST");
      expect(permissions).toEqual([]);
    });

    it("returns empty array for unknown role", () => {
      const permissions = getRolePermissions("UNKNOWN" as Role);
      expect(permissions).toEqual([]);
    });
  });
});
