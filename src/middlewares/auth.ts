import type { NextFunction, Request, Response } from "express";

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: { message: "Unauthorized" } });
    return;
  }

  // TODO Entrega 2: verificar JWT con JWT_SECRET
  res.locals.user = {
    id: "a1b2c3d4-0000-4000-8000-000000000001",
    email: "ana@recall.app",
    name: "Ana García",
  };

  next();
}
