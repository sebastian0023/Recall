import { Router } from "express";
import {
    createTranscription,
    deleteTranscription,
    getTranscriptionById,
    getTranscriptions,
    updateTranscription,
} from "../controllers/transcription.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import {
    createTranscriptionBody,
    listTranscriptionsQuery,
    updateTranscriptionBody,
} from "../schemas/transcription.schema.js";

const router = Router();

router.use(auth);

router.get("/", validate({ query: listTranscriptionsQuery }), getTranscriptions);
router.get("/:id", validate({ params: idParams }), getTranscriptionById);
router.post("/", validate({ body: createTranscriptionBody }), createTranscription);
router.patch("/:id", validate({ params: idParams, body: updateTranscriptionBody }), updateTranscription);
router.delete("/:id", validate({ params: idParams }), deleteTranscription);

export default router;
