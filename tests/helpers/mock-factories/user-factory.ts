import { faker } from "@faker-js/faker";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "SUPPORT" | "EDITOR";
  avatar: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function buildMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "EDITOR",
    avatar: faker.image.avatar(),
    emailVerified: new Date(),
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildAdminUser(overrides: Partial<MockUser> = {}): MockUser {
  return buildMockUser({ role: "ADMIN", ...overrides });
}

export function buildSuperAdminUser(overrides: Partial<MockUser> = {}): MockUser {
  return buildMockUser({ role: "SUPER_ADMIN", ...overrides });
}

export function buildSupportUser(overrides: Partial<MockUser> = {}): MockUser {
  return buildMockUser({ role: "SUPPORT", ...overrides });
}

export function buildManagerUser(overrides: Partial<MockUser> = {}): MockUser {
  return buildMockUser({ role: "MANAGER", ...overrides });
}

export function buildAccountantUser(overrides: Partial<MockUser> = {}): MockUser {
  return buildMockUser({ role: "ACCOUNTANT", ...overrides });
}
