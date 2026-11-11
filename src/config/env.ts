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

// Duraciones: segundos ("3600") o un número con unidad ("30s", "15m", "1h", "7d")
const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;
function duration(name: string, fallback: string): { raw: string; seconds: number } {
  const raw = process.env[name] || fallback;
  const match = /^(\d+)([smhd]?)$/.exec(raw);
  if (!match) {
    throw new Error(`${name} is invalid ("${raw}"); use seconds or a number with s, m, h or d (e.g. 15m)`);
  }
  const unit = (match[2] || "s") as keyof typeof UNIT_SECONDS;
  return { raw, seconds: Number(match[1]) * UNIT_SECONDS[unit] };
}

// Duración de la sesión
const JWT_EXPIRES_IN = duration("JWT_EXPIRES_IN", "1h").raw;

// Vigencia de los enlaces de un solo uso que se mandan por correo
const VERIFY_TOKEN_TTL = duration("VERIFY_TOKEN_TTL", "24h").seconds;
const RESET_TOKEN_TTL = duration("RESET_TOKEN_TTL", "1h").seconds;

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

// Correo (nodemailer). Los valores por defecto apuntan a Mailpit (docker compose up -d), que no pide credenciales
const SMTP_PORT = Number(process.env.SMTP_PORT || 1025);
if (!Number.isInteger(SMTP_PORT) || SMTP_PORT < 1 || SMTP_PORT > 65535) {
  throw new Error(`SMTP_PORT is invalid ("${process.env.SMTP_PORT}"); use a port between 1 and 65535`);
}
const SMTP_SECURE_RAW = (process.env.SMTP_SECURE || "false").toLowerCase();
if (SMTP_SECURE_RAW !== "true" && SMTP_SECURE_RAW !== "false") {
  throw new Error(`SMTP_SECURE is invalid ("${process.env.SMTP_SECURE}"); use true or false`);
}

// URL pública del API: se usa para armar los enlaces de los correos. Sin "/" al final
const PORT = Number(process.env.PORT) || 3000;
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
try {
  new URL(APP_URL);
} catch {
  throw new Error(`APP_URL is not a valid URL ("${APP_URL}")`);
}

// Nivel mínimo que se escribe en el log (de más a menos grave): fatal, error, warn, info, debug, trace o silent
const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];
const LOG_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();
if (!LOG_LEVELS.includes(LOG_LEVEL as LogLevel)) {
  throw new Error(`LOG_LEVEL is invalid ("${LOG_LEVEL}"); use one of: ${LOG_LEVELS.join(", ")}`);
}

export const env = {
  PORT,
  NODE_ENV,
  LOG_LEVEL: LOG_LEVEL as LogLevel,
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET,
  JWT_EXPIRES_IN,
  // En segundos
  VERIFY_TOKEN_TTL,
  RESET_TOKEN_TTL,
  APP_URL,
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT,
  SMTP_SECURE: SMTP_SECURE_RAW === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  MAIL_FROM: process.env.MAIL_FROM || "Recall <no-reply@recall.local>",
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  GOOGLE_ENABLED: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && GOOGLE_CALLBACK_URL),
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  // Se usan en entregas siguientes (archivos y resúmenes con IA)
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? "",
};
