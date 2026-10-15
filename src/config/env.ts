import "dotenv/config";

const { DATABASE_URL, JWT_SECRET } = process.env;

if (!DATABASE_URL) {
  throw new Error("Falta la variable de entorno DATABASE_URL (revisa tu .env)");
}
if (!JWT_SECRET) {
  throw new Error("Falta la variable de entorno JWT_SECRET (revisa tu .env)");
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1d",
};
