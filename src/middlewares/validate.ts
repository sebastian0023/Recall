import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";
import { ApiError, type ErrorDetail } from "../lib/apiError.js";

// Mensajes por defecto más claros que los de zod; los mensajes propios de cada esquema tienen prioridad
z.config({
    customError: (issue) => {
        if (issue.code === "invalid_type") {
            return issue.input === undefined ? "Is required" : `Must be of type ${issue.expected}`;
        }
        return undefined;
    },
});

interface Schemas {
    body?: ZodType;
    params?: ZodType;
    query?: ZodType;
}

// Valida body, params y query antes de llegar al controlador.
// - body: el resultado (sin campos desconocidos) reemplaza a req.body.
// - query: en Express 5 req.query es de solo lectura, por eso el resultado va en res.locals.query.
export function validate(schemas: Schemas): RequestHandler {
    return (req, res, next) => {
        const details: ErrorDetail[] = [];

        const run = (schema: ZodType | undefined, input: unknown): unknown => {
            if (!schema) return input;
            const result = schema.safeParse(input);
            if (result.success) return result.data;
            for (const issue of result.error.issues) {
                if (issue.code === "unrecognized_keys") {
                    // Un detalle por cada campo desconocido, con su nombre en field
                    for (const key of issue.keys) {
                        details.push({ field: [...issue.path, key].join("."), message: "Unknown field" });
                    }
                    continue;
                }
                // Errores a nivel de objeto (p. ej. PATCH vacío) no tienen path: se reportan como "body"
                details.push({ field: issue.path.join(".") || "body", message: issue.message });
            }
            return input;
        };

        // Express 5: req.body es undefined si la petición no trae body
        const body = run(schemas.body, req.body ?? {});
        run(schemas.params, req.params);
        const query = run(schemas.query, req.query);

        if (details.length > 0) {
            next(new ApiError(400, "Invalid data", details));
            return;
        }

        if (schemas.body) req.body = body;
        res.locals.query = query;
        next();
    };
}
