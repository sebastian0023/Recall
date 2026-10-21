import type { NextFunction, Request, Response } from "express";
import { accessTokenVerifier } from "../lib/cognito.js";
import { prisma } from "../lib/prisma.js";

export async function auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: { message: "Unauthorized" } });
        return;
    }

    try {
        const payload = await accessTokenVerifier.verify(header.slice(7));
        const user = await prisma.user.findUnique({ where: { cognitoSub: payload.sub } });

        if (!user) {
            res.status(401).json({ error: { message: "User not registered" } });
            return;
        }

        // Mismo shape que antes: el resto de controllers sigue leyendo res.locals.user.id
        res.locals.user = { id: user.id, email: user.email };
        next();
    } catch {
        res.status(401).json({ error: { message: "Invalid or expired token" } });
    }
}
