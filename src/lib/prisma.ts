import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { PrismaClient } from "../generated/prisma/client.js";

// passwordHash se omite en todas las consultas (también en include: { user: true });
// solo el login lo pide explícitamente con omit: { passwordHash: false }
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  omit: { user: { passwordHash: true } },
});
