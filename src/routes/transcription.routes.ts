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

router.get("/", auth, getTranscriptions);
router.get("/:id", auth, getTranscriptionById);
router.post("/", auth, createTranscription);
router.patch("/:id", auth, updateTranscription);
router.delete("/:id", auth, deleteTranscription);

export default router;
