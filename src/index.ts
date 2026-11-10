import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    logger.fatal(
      { err },
      "Could not connect to the database. Check DATABASE_URL in your .env and that PostgreSQL is running (docker compose up -d).",
    );
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV, logLevel: env.LOG_LEVEL }, "Connected to the database. Recall API listening");
  });
}

main();
