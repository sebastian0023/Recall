import { createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import type { AuthTokenPurpose, Prisma } from "../generated/prisma/client.js";
import { ApiError } from "./apiError.js";
import { prisma } from "./prisma.js";

const DEFAULT_TTL: Record<AuthTokenPurpose, number> = {
    VERIFY_EMAIL: env.VERIFY_TOKEN_TTL,
    RESET_PASSWORD: env.RESET_TOKEN_TTL,
};

// En la BD solo se guarda el hash: aunque se filtre la tabla, los enlaces no se pueden reconstruir
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

// Crea un token de un solo uso y lo regresa en claro (solo se puede mandar por correo, no se guarda).
// Los tokens anteriores sin usar del mismo usuario y propósito quedan invalidados.
export async function createToken(
    userId: string,
    purpose: AuthTokenPurpose,
    ttlSeconds: number = DEFAULT_TTL[purpose],
): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await prisma.$transaction([
        prisma.authToken.deleteMany({ where: { userId, purpose, usedAt: null } }),
        prisma.authToken.create({
            data: { userId, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlSeconds * 1000) },
        }),
    ]);
    return token;
}

// Marca el token como usado y regresa el id del usuario. Lanza ApiError(400) si no sirve.
// El UPDATE lleva usedAt: null y expiresAt en el where, así dos peticiones a la vez no pueden usarlo las dos.
// db permite pasar la transacción de quien lo llama (p. ej. consumir el token y cambiar la contraseña juntos)
export async function consumeToken(
    token: string,
    purpose: AuthTokenPurpose,
    db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<string> {
    const tokenHash = hashToken(token);
    const now = new Date();

    const [used] = await db.authToken.updateManyAndReturn({
        where: { tokenHash, purpose, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
        select: { userId: true },
    });
    if (used) return used.userId;

    // No sirvió: se busca el motivo solo para dar un mensaje claro
    const existing = await db.authToken.findUnique({ where: { tokenHash }, select: { purpose: true, usedAt: true } });
    if (!existing || existing.purpose !== purpose) throw new ApiError(400, "Invalid token");
    if (existing.usedAt) throw new ApiError(400, "Token already used");
    throw new ApiError(400, "Token expired");
}
