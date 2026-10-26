import { Router } from "express";
import {
    createRecording,
    deleteRecording,
    getRecordingById,
    getRecordings,
    getRecordingSummaries,
    getRecordingTranscription,
    processRecording,
    updateRecording,
} from "../controllers/recording.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { createRecordingBody, listRecordingsQuery, updateRecordingBody } from "../schemas/recording.schema.js";

const router = Router();

router.use(auth);

router.get("/", validate({ query: listRecordingsQuery }), getRecordings);
router.get("/:id", validate({ params: idParams }), getRecordingById);
router.get("/:id/summaries", validate({ params: idParams }), getRecordingSummaries);
router.get("/:id/transcription", validate({ params: idParams }), getRecordingTranscription);
router.post("/", validate({ body: createRecordingBody }), createRecording);
router.patch("/:id", validate({ params: idParams, body: updateRecordingBody }), updateRecording);
router.delete("/:id", validate({ params: idParams }), deleteRecording);
router.post("/:id/process", validate({ params: idParams }), processRecording);

export default router;
