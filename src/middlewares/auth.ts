import { env } from "../config/env.js";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import type { AuthUser } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";
import { verifyToken } from "../lib/token.js";

export const SESSION_COOKIE = "recall_session";

// Misma cookie de sesión para el login con contraseña y el login con Google
export function setSessionCookie(res: Response, token: string, expiresInSeconds: number) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: expiresInSeconds * 1000,
    });
}

// Verifica el JWT y carga al usuario desde la BD (el rol se lee en cada petición)
async function userFromToken(token: string): Promise<AuthUser> {
    const userId = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(401, "User not registered");

    return { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified };
}

// API: exige Authorization: Bearer <jwt>. Cualquier fallo responde 401
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        next(new ApiError(401, "Unauthorized"));
        return;
    }

    req.user = await userFromToken(header.slice("Bearer ".length));
    next();
}

// Vistas: usa la cookie de sesión y redirige a /login si falta o es inválida
export async function viewAuth(req: Request, res: Response, next: NextFunction) {
    const token = (req.cookies as Record<string, string | undefined>)[SESSION_COOKIE];

    if (!token) {
        res.redirect("/login");
        return;
    }

    try {
        req.user = await userFromToken(token);
    } catch {
        res.clearCookie(SESSION_COOKIE);
        res.redirect("/login");
        return;
    }
    res.locals.user = req.user; // las plantillas leen user
    next();
}
