import { z } from "zod";
import { atLeastOne, uuid } from "./common.schema.js";

const language = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "Must be a language code like es-US");
const fullText = z.string().min(1, "Must not be empty");

const segment = z
    .strictObject({
        speaker: z.string().min(1, "Must not be empty"),
        startMs: z.number({ error: "Must be a number" }).int("Must be an integer").min(0, "Must be 0 or more"),
        endMs: z.number({ error: "Must be a number" }).int("Must be an integer").min(0, "Must be 0 or more"),
        text: z.string(),
    })
    .refine((s) => s.endMs >= s.startMs, { path: ["endMs"], error: "Must be greater than or equal to startMs" });

const segments = z.array(segment, { error: "Must be an array of segments" });

export const createTranscriptionBody = z.strictObject({
    recordingId: uuid,
    language: language.optional(),
    fullText,
    segments: segments.optional(),
});

export const updateTranscriptionBody = atLeastOne(
    z.strictObject({
        language: language.optional(),
        fullText: fullText.optional(),
        segments: segments.optional(),
    }),
);

export const listTranscriptionsQuery = z.object({
    recordingId: uuid.optional(),
});
