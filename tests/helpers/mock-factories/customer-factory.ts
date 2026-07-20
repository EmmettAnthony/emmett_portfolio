import { faker } from "@faker-js/faker";

export interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  notes: string | null;
  tags: string[];
  status: "ACTIVE" | "INACTIVE" | "LEAD";
  totalInvoices: number;
  totalPaid: number;
  totalOutstanding: number;
  createdAt: Date;
  updatedAt: Date;
}

export function buildMockCustomer(overrides: Partial<MockCustomer> = {}): MockCustomer {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    website: faker.internet.url(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: faker.location.country(),
    notes: faker.helpers.maybe(() => faker.lorem.sentence()) ?? null,
    tags: faker.helpers.multiple(() => faker.word.adjective(), { count: { min: 0, max: 3 } }),
    status: "ACTIVE",
    totalInvoices: faker.number.int({ min: 0, max: 20 }),
    totalPaid: faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }),
    totalOutstanding: 0,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildCustomerList(count: number, overrides?: Partial<MockCustomer>): MockCustomer[] {
  return Array.from({ length: count }, () => buildMockCustomer(overrides));
}
