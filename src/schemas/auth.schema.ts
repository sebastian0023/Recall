import { z } from "zod";
import { email } from "./common.schema.js";

export const registerBody = z.strictObject({
    email,
    password: z.string().min(8, "Must be at least 8 characters").max(72, "Must be at most 72 characters"),
    name: z.string().trim().min(1, "Must not be empty").max(100, "Must be at most 100 characters"),
});

export const loginBody = z.strictObject({
    email,
    password: z.string().min(1, "Is required"),
});

// Los tokens de un solo uso son 32 bytes aleatorios en hexadecimal (ver src/lib/oneTimeToken.ts)
export const token = z.string().trim().regex(/^[0-9a-f]{64}$/, "Must be a valid token");

export const verifyEmailBody = z.strictObject({ token });
