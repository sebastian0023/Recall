import { z } from "zod";
import { atLeastOne, email } from "./common.schema.js";

export const updateUserBody = atLeastOne(
    z.strictObject({
        name: z.string().trim().min(1, "Must not be empty").max(100, "Must be at most 100 characters").optional(),
        email: email.optional(),
    }),
);
