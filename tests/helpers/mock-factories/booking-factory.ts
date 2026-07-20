import { faker } from "@faker-js/faker";

export interface MockBooking {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  meetingType: string;
  meetingTypeId: string;
  preferredDate: Date;
  preferredTime: string;
  duration: number;
  timezone: string;
  message: string | null;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";
  source: string;
  notes: string | null;
  cancellationReason: string | null;
  rescheduleCount: number;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function buildMockBooking(overrides: Partial<MockBooking> = {}): MockBooking {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    meetingType: faker.helpers.arrayElement(["Discovery Call", "Consultation", "Project Review", "Support"]),
    meetingTypeId: faker.string.uuid(),
    preferredDate: faker.date.future(),
    preferredTime: `${faker.number.int({ min: 8, max: 17 })}:00`,
    duration: 30,
    timezone: faker.location.timeZone(),
    message: faker.helpers.maybe(() => faker.lorem.paragraph()) ?? null,
    status: "PENDING",
    source: "WEBSITE",
    notes: null,
    cancellationReason: null,
    rescheduleCount: 0,
    reminderSent: false,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildConfirmedBooking(overrides?: Partial<MockBooking>): MockBooking {
  return buildMockBooking({ status: "CONFIRMED", ...overrides });
}

export function buildCancelledBooking(overrides?: Partial<MockBooking>): MockBooking {
  return buildMockBooking({
    status: "CANCELLED",
    cancellationReason: faker.lorem.sentence(),
    ...overrides,
  });
}

export function buildBookingList(count: number, overrides?: Partial<MockBooking>): MockBooking[] {
  return Array.from({ length: count }, () => buildMockBooking(overrides));
}
