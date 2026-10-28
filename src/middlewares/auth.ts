import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { getAccessTokenVerifier } from "../lib/cognito.js";
import { prisma } from "../lib/prisma.js";

export async function auth(req: Request, res: Response, next: NextFunction) {
    // Modo dummy: la autenticación real se evalúa en otra entrega, no se verifica el token
    if (env.AUTH_MODE === "dummy") {
        next();
        return;
    }

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        next(new ApiError(401, "Unauthorized"));
        return;
    }

    try {
        const payload = await getAccessTokenVerifier().verify(header.slice(7));
        const user = await prisma.user.findUnique({ where: { cognitoSub: payload.sub } });

        if (!user) {
            next(new ApiError(401, "User not registered"));
            return;
        }

        // Mismo shape que antes: el resto de controllers sigue leyendo res.locals.user.id
        res.locals.user = { id: user.id, email: user.email };
        next();
    } catch {
        next(new ApiError(401, "Invalid or expired token"));
    }
}
