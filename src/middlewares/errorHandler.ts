import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";

// Códigos de error de Prisma traducidos a status HTTP; la respuesta nunca expone el código de la BD
const PRISMA_ERRORS: Record<string, [number, string]> = {
    P2000: [400, "Value too long for a field"],
    P2002: [409, "Resource already exists"],
    P2003: [409, "Operation conflicts with related resources"],
    P2007: [400, "Invalid id format"],
    P2011: [400, "A required field is missing"],
    P2012: [400, "A required field is missing"],
    P2023: [400, "Invalid id format"],
    P2025: [404, "Resource not found"],
};

function errorField(err: unknown, key: "code" | "type"): string | undefined {
    if (typeof err !== "object" || err === null || !(key in err)) return undefined;
    const value = (err as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
}

// Debe tener 4 parámetros para que Express lo reconozca como manejador de errores.
// Todas las respuestas de error salen de aquí con el formato { error: { message, details? } }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ApiError) {
        res.status(err.status).json({
            error: { message: err.message, ...(err.details && { details: err.details }) },
        });
        return;
    }

    const code = errorField(err, "code");
    const mapped = code ? PRISMA_ERRORS[code] : undefined;
    if (mapped) {
        res.status(mapped[0]).json({ error: { message: mapped[1] } });
        return;
    }

    // Prisma rechazó los datos antes de llegar a la BD (campo faltante o de tipo incorrecto)
    if (err instanceof Error && err.name === "PrismaClientValidationError") {
        console.error(err);
        res.status(400).json({ error: { message: "Invalid request data" } });
        return;
    }

    // Errores de express.json: JSON mal formado o body demasiado grande
    if (err instanceof SyntaxError && "body" in err) {
        res.status(400).json({ error: { message: "Invalid JSON body" } });
        return;
    }
    if (errorField(err, "type") === "entity.too.large") {
        res.status(413).json({ error: { message: "Request body too large" } });
        return;
    }

    // El detalle (stack incluido) solo se escribe en la consola del servidor
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error" } });
}
