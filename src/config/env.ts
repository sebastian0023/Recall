import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (check your .env file)`);
  return value;
}

const NODE_ENV = process.env.NODE_ENV ?? "development";

// Secreto con el que se firman los JWT (HS256). Debe ser largo y no estar en el repositorio
const EXAMPLE_JWT_SECRET = "dev-only-secret-change-me-before-deploying-0123456789";
const JWT_SECRET = required("JWT_SECRET");
if (JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be at least 32 characters long");
if (NODE_ENV === "production" && JWT_SECRET === EXAMPLE_JWT_SECRET) {
  throw new Error("JWT_SECRET must not use the example value when NODE_ENV=production");
}

// Duración de la sesión: segundos ("3600") o un número con unidad ("30s", "15m", "1h", "7d")
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
if (!/^\d+$|^\d+(s|m|h|d)$/.test(JWT_EXPIRES_IN)) {
  throw new Error(`JWT_EXPIRES_IN is invalid ("${JWT_EXPIRES_IN}"); use seconds or a number with s, m, h or d (e.g. 15m)`);
}

// Login con Google (opcional): sin estas tres variables el botón no aparece y /auth/google responde 503.
// La ruta del callback sale de GOOGLE_CALLBACK_URL, y esa misma URL debe estar autorizada en Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL ?? "";
if (GOOGLE_CALLBACK_URL) {
  try {
    new URL(GOOGLE_CALLBACK_URL);
  } catch {
    throw new Error(`GOOGLE_CALLBACK_URL is not a valid URL ("${GOOGLE_CALLBACK_URL}")`);
  }
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV,
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET,
  JWT_EXPIRES_IN,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  GOOGLE_ENABLED: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL),
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  // Se usan en entregas siguientes (archivos y resúmenes con IA)
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? "",
};
