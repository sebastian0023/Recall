import { z } from "zod";

export const uuid = z.uuid({ error: "Must be a valid UUID" });

export const idParams = z.object({ id: uuid });

// PATCH: exige al menos un campo para evitar actualizaciones vacías
export function atLeastOne<T extends z.ZodObject>(schema: T) {
    return schema.refine((data) => Object.values(data).some((value) => value !== undefined), {
        error: "At least one field is required",
    });
}

export const email = z.email({ error: "Must be a valid email" }).max(254);
