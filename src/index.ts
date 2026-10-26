import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

async function main() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    console.error("Could not connect to the database. Check DATABASE_URL in your .env and that PostgreSQL is running (docker compose up -d).");
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`Connected to the database. Recall API listening on port ${env.PORT} (auth: ${env.AUTH_MODE})`);
  });
}

main();
