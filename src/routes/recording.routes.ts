import { Router } from "express";
import {
    createRecording,
    deleteRecording,
    getRecordingById,
    getRecordings,
    processRecording,
    updateRecording,
} from "../controllers/recording.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.use(auth);

router.get("/", getRecordings);
router.get("/:id", getRecordingById);
router.post("/", createRecording);
router.patch("/:id", updateRecording);
router.delete("/:id", deleteRecording);
router.post("/:id/process", processRecording);

export default router;
