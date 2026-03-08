import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const retentionDaysEnv = process.env.ANALYTICS_RETENTION_DAYS;
  const retentionDays = retentionDaysEnv ? parseInt(retentionDaysEnv, 10) : 365;

  if (Number.isNaN(retentionDays) || retentionDays <= 0) {
    throw new Error("ANALYTICS_RETENTION_DAYS must be a positive integer if set.");
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const result = await prisma.analyticsEvent.deleteMany({
    where: {
      createdAt: {
        lt: cutoff,
      },
    },
  });

  console.log(
    `Deleted ${result.count} analytics events older than ${retentionDays} days (before ${cutoff.toISOString()}).`,
  );
}

main()
  .catch((error) => {
    console.error("Failed to cleanup analytics events:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

