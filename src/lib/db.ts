import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Set it in .env.local to enable database features."
    );
  }

  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeon(sql);

  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  globalForPrisma.prisma = createPrismaClient();
  return globalForPrisma.prisma;
}

type PrismaClientKey = keyof PrismaClient;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: PrismaClientKey) {
    return getPrisma()[prop];
  },
});
