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

// Mismas reglas al registrarse y al restablecer la contraseña (72 es el límite de bcrypt)
export const password = z.string().min(8, "Must be at least 8 characters").max(72, "Must be at most 72 characters");
