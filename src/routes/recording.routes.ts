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

router.get("/", auth, getRecordings);
router.get("/:id", auth, getRecordingById);
router.post("/", auth, createRecording);
router.patch("/:id", auth, updateRecording);
router.delete("/:id", auth, deleteRecording);
router.post("/:id/process", auth, processRecording);

export default router;
