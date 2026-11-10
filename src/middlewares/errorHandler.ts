import type { NextFunction, Request, Response } from "express";
import { ApiError, type ErrorDetail } from "../lib/apiError.js";

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

// Todas las respuestas de error tienen el formato { error: { message, details?, requestId } }.
// requestId es el mismo del encabezado X-Request-Id y de las líneas del log de esa petición
function sendError(req: Request, res: Response, status: number, message: string, details?: ErrorDetail[]) {
    res.status(status).json({
        error: { message, ...(details && { details }), requestId: String(req.id) },
    });
}

// Debe tener 4 parámetros para que Express lo reconozca como manejador de errores.
// Los errores esperados (4xx) ya quedan en la línea de la petición como warn; su detalle va en debug.
// Los inesperados se escriben como error con el stack. La respuesta nunca incluye el stack
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ApiError) {
        if (err.status >= 500) req.log.error({ err }, err.message);
        else req.log.debug({ status: err.status, message: err.message, details: err.details }, "Request rejected");
        sendError(req, res, err.status, err.message, err.details);
        return;
    }

    const code = errorField(err, "code");
    const mapped = code ? PRISMA_ERRORS[code] : undefined;
    if (mapped) {
        req.log.debug({ prismaCode: code, status: mapped[0] }, mapped[1]);
        sendError(req, res, mapped[0], mapped[1]);
        return;
    }

    // Prisma rechazó los datos antes de llegar a la BD (campo faltante o de tipo incorrecto): indica un bug
    if (err instanceof Error && err.name === "PrismaClientValidationError") {
        req.log.error({ err }, "Prisma rejected the query data");
        sendError(req, res, 400, "Invalid request data");
        return;
    }

    // Errores de express.json: JSON mal formado o body demasiado grande
    if (err instanceof SyntaxError && "body" in err) {
        req.log.debug("Invalid JSON body");
        sendError(req, res, 400, "Invalid JSON body");
        return;
    }
    if (errorField(err, "type") === "entity.too.large") {
        req.log.debug("Request body too large");
        sendError(req, res, 413, "Request body too large");
        return;
    }

    req.log.error({ err }, "Unhandled error");
    sendError(req, res, 500, "Internal server error");
}
