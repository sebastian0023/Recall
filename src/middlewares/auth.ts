import type { NextFunction, Request, Response } from "express";
import { dummyUsers } from "../models/user.model.js";

export function auth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: { message: "Unauthorized" } });
        return;
    }

    // TODO Entrega 2: verificar el JWT con JWT_SECRET
    const user = dummyUsers[0]!;
    res.locals.user = { id: user.id, email: user.email };

    next();
}
