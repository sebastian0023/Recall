import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name} (check your .env file)`);
  return value;
}

// "dummy": register/login solo usan la BD y el middleware auth deja pasar (para probar sin Cognito)
// "cognito": autenticación real con Amazon Cognito
const AUTH_MODE = process.env.AUTH_MODE === "dummy" ? "dummy" : "cognito";

// Las variables de Cognito solo se exigen cuando se usa el modo real
const cognito = (name: string): string =>
  AUTH_MODE === "cognito" ? required(name) : (process.env[name] ?? "");

if (AUTH_MODE === "dummy" && process.env.NODE_ENV === "production") {
  throw new Error("AUTH_MODE=dummy is not allowed when NODE_ENV=production");
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: required("DATABASE_URL"),
  AUTH_MODE: AUTH_MODE as "dummy" | "cognito",
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  COGNITO_USER_POOL_ID: cognito("COGNITO_USER_POOL_ID"),
  COGNITO_CLIENT_ID: cognito("COGNITO_CLIENT_ID"),
  // Solo si el app client de Cognito se creó con client secret
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET || undefined,
  // Se usan en entregas siguientes (archivos y resúmenes con IA)
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? "",
};
