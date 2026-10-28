import { z } from "zod";
import { atLeastOne, uuid } from "./common.schema.js";

export const summaryTemplate = z.enum(["MEETING", "CLASS", "INTERVIEW"], {
    error: "Must be one of: MEETING, CLASS, INTERVIEW",
});

const content = z.string().min(1, "Must not be empty").max(20000, "Must be at most 20000 characters");

export const createSummaryBody = z.strictObject({
    recordingId: uuid,
    template: summaryTemplate,
    content,
});

export const updateSummaryBody = atLeastOne(
    z.strictObject({
        template: summaryTemplate.optional(),
        content: content.optional(),
    }),
);

export const listSummariesQuery = z.object({
    recordingId: uuid.optional(),
    template: summaryTemplate.optional(),
});
