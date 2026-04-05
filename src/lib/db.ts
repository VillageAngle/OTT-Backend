import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

// Clean up on process termination
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
