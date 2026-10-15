import { Router } from "express";
import {
  createSummary,
  deleteSummary,
  getSummaries,
  getSummaryById,
  updateSummary,
} from "../controllers/summary.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.get("/", auth, getSummaries);
router.get("/:id", auth, getSummaryById);
router.post("/", auth, createSummary);
router.patch("/:id", auth, updateSummary);
router.delete("/:id", auth, deleteSummary);

export default router;
