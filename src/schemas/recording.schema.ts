import { z } from "zod";
import { atLeastOne, uuid } from "./common.schema.js";

export const recordingStatus = z.enum(["UPLOADED", "PROCESSING", "DONE", "FAILED"], {
    error: "Must be one of: UPLOADED, PROCESSING, DONE, FAILED",
});

const title = z.string().trim().min(1, "Must not be empty").max(200, "Must be at most 200 characters");
const s3Key = z.string().trim().min(1, "Must not be empty").max(500, "Must be at most 500 characters");
const durationSec = z.number({ error: "Must be a number" }).int("Must be an integer").min(0, "Must be 0 or more");

export const createRecordingBody = z.strictObject({
    userId: uuid,
    title,
    s3Key,
    durationSec: durationSec.nullish(),
});

export const updateRecordingBody = atLeastOne(
    z.strictObject({
        title: title.optional(),
        s3Key: s3Key.optional(),
        durationSec: durationSec.nullable().optional(),
        status: recordingStatus.optional(),
        errorMessage: z.string().max(1000, "Must be at most 1000 characters").nullable().optional(),
    }),
);

export const listRecordingsQuery = z.object({
    status: recordingStatus.optional(),
    userId: uuid.optional(),
});
