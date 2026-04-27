import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString: dbUrl });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  } as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
