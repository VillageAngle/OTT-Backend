import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ["error", "warn"],
});

// Clean up on process termination
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
