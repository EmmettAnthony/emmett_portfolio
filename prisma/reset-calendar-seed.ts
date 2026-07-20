import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/neondb";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 Resetting calendar seed data...\n");

  // Delete in dependency order (child tables first, respecting FK constraints)
  console.log("  Clearing calendar events...");
  await prisma.calendarEvent.deleteMany();

  console.log("  Clearing appointment logs...");
  await prisma.appointmentLog.deleteMany();

  console.log("  Clearing appointments...");
  await prisma.appointment.deleteMany();

  console.log("  Clearing calendar tasks...");
  await prisma.calendarTask.deleteMany();

  console.log("  Clearing reminders...");
  await prisma.reminder.deleteMany();

  console.log("  Clearing meeting types...");
  await prisma.meetingType.deleteMany();

  console.log("  Clearing availability...");
  await prisma.availability.deleteMany();

  console.log("  Clearing date exceptions...");
  await prisma.dateException.deleteMany();

  console.log("  Clearing calendar integrations...");
  await prisma.calendarIntegration.deleteMany();

  console.log("  Clearing notifications (from cron)...");
  await prisma.notification.deleteMany();

  console.log("\n✅ All calendar data cleared.\n");

  // Re-seed calendar data
  console.log("🌱 Re-seeding calendar data...\n");

  // Import and run the seed's calendar function
  const { seedCalendar } = await import("./seed");
  await seedCalendar();

  console.log("\n✅ Calendar seed reset complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Reset failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
