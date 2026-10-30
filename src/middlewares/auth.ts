import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { getAccessTokenVerifier } from "../lib/cognito.js";
import type { AuthUser } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";
import { uuid } from "../schemas/common.schema.js";

export const SESSION_COOKIE = "recall_session";

async function findTokenOwner(token: string) {
    if (env.AUTH_MODE === "dummy") {
        const id = uuid.safeParse(token.startsWith("dummy-") ? token.slice("dummy-".length) : "");
        return id.success ? prisma.user.findUnique({ where: { id: id.data } }) : null;
    }

    const payload = await getAccessTokenVerifier().verify(token);
    return prisma.user.findUnique({ where: { cognitoSub: payload.sub } });
}

async function userFromToken(token: string): Promise<AuthUser> {
    let user;
    try {
        user = await findTokenOwner(token);
    } catch {
        throw new ApiError(401, "Invalid or expired token");
    }
    if (!user) throw new ApiError(401, "User not registered");

    return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        next(new ApiError(401, "Unauthorized"));
        return;
    }

    res.locals.user = await userFromToken(header.slice("Bearer ".length));
    next();
}

export async function viewAuth(req: Request, res: Response, next: NextFunction) {
    const token = (req.cookies as Record<string, string | undefined>)[SESSION_COOKIE];

    if (!token) {
        res.redirect("/login");
        return;
    }

    try {
        res.locals.user = await userFromToken(token);
    } catch {
        res.clearCookie(SESSION_COOKIE);
        res.redirect("/login");
        return;
    }
    next();
}
