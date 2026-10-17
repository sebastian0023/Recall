import { Router } from "express";
import {
    createTranscription,
    deleteTranscription,
    getTranscriptionById,
    getTranscriptions,
    updateTranscription,
} from "../controllers/transcription.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.use(auth);

router.get("/", getTranscriptions);
router.get("/:id", getTranscriptionById);
router.post("/", createTranscription);
router.patch("/:id", updateTranscription);
router.delete("/:id", deleteTranscription);

export default router;
