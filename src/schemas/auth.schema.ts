import { z } from "zod";
import { email, password } from "./common.schema.js";

export const registerBody = z.strictObject({
    email,
    password,
    name: z.string().trim().min(1, "Must not be empty").max(100, "Must be at most 100 characters"),
});

export const loginBody = z.strictObject({
    email,
    password: z.string().min(1, "Is required"),
});

// Los tokens de un solo uso son 32 bytes aleatorios en hexadecimal (ver src/lib/oneTimeToken.ts)
export const token = z.string().trim().regex(/^[0-9a-f]{64}$/, "Must be a valid token");

export const verifyEmailBody = z.strictObject({ token });

export const forgotPasswordBody = z.strictObject({ email });

export const resetPasswordBody = z.strictObject({ token, password });
