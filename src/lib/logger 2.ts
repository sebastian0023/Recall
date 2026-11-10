import { pino, type DestinationStream } from "pino";
import { env } from "../config/env.js";

// Campos que nunca se escriben en el log, aunque alguien los pase por error
const REDACT_PATHS = [
    "password",
    "*.password",
    "passwordHash",
    "*.passwordHash",
    "token",
    "*.token",
    "accessToken",
    "*.accessToken",
    "authorization",
    "*.authorization",
    "cookie",
    "*.cookie",
    "req.headers.authorization",
    "req.headers.cookie",
    'res.headers["set-cookie"]',
];

// En desarrollo, formato fácil de leer. pino-pretty es devDependency (no existe en la imagen Docker),
// por eso se carga solo fuera de producción. Es síncrono para que el último mensaje salga antes de process.exit
async function prettyStream(): Promise<DestinationStream | undefined> {
    if (env.NODE_ENV === "production") return undefined;
    const { default: pretty } = await import("pino-pretty");
    // El mensaje de cada petición ya trae método, ruta, status y ms; se ocultan esos campos para que quepa en una línea
    // Los colores se activan solos en una terminal; si la salida va a un archivo, se escribe sin códigos de color
    return pretty({
        sync: true,
        singleLine: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,service,req,res,responseTime",
    });
}

// El único logger del proyecto. En producción escribe JSON, una línea por evento
export const logger = pino(
    {
        level: env.LOG_LEVEL,
        base: { service: "recall-api" },
        timestamp: pino.stdTimeFunctions.isoTime,
        // En JSON el nivel sale como texto ("level":"warn") para poder filtrarlo sin conocer los números de pino
        ...(env.NODE_ENV === "production" && { formatters: { level: (label: string) => ({ level: label }) } }),
        redact: { paths: REDACT_PATHS, censor: "[Redacted]" },
    },
    await prettyStream(),
);

// Query params que llevan secretos (enlaces de verificación y recuperación, callback de Google)
const SECRET_PARAMS = new Set(["token", "code", "state"]);

// Oculta el valor de esos params en la URL que se escribe en el log: /verify-email?token=[Redacted]
export function maskUrl(url: string): string {
    const queryStart = url.indexOf("?");
    if (queryStart === -1) return url;

    const query = url
        .slice(queryStart + 1)
        .split("&")
        .map((pair) => {
            const name = pair.split("=", 1)[0] ?? "";
            return SECRET_PARAMS.has(decodeURIComponentSafe(name).toLowerCase()) ? `${name}=[Redacted]` : pair;
        })
        .join("&");
    return `${url.slice(0, queryStart)}?${query}`;
}

function decodeURIComponentSafe(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}
