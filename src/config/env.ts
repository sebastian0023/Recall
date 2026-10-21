import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name} (revisa tu .env)`);
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: required("DATABASE_URL"),
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",
  COGNITO_USER_POOL_ID: required("COGNITO_USER_POOL_ID"),
  COGNITO_CLIENT_ID: required("COGNITO_CLIENT_ID"),
  // Solo si el app client de Cognito se creó con client secret
  COGNITO_CLIENT_SECRET: process.env.COGNITO_CLIENT_SECRET || undefined,
};
