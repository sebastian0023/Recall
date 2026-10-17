import { Router } from "express";
import authRoutes from "./auth.routes.js";
import recordingRoutes from "./recording.routes.js";
import summaryRoutes from "./summary.routes.js";
import transcriptionRoutes from "./transcription.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/recordings", recordingRoutes);
router.use("/transcriptions", transcriptionRoutes);
router.use("/summaries", summaryRoutes);

export default router;
