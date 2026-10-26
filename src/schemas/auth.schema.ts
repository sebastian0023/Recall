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

export const confirmBody = z.strictObject({
    email,
    code: z.string().regex(/^\d{6}$/, "Must be a 6-digit code"),
});
