import type { NextFunction, Request, Response } from "express";

// Debe tener 4 parámetros para que Express lo reconozca como manejador de errores
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    console.error(err);

    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ error: { message } });
}
