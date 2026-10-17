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

router.use(auth);

router.get("/", getSummaries);
router.get("/:id", getSummaryById);
router.post("/", createSummary);
router.patch("/:id", updateSummary);
router.delete("/:id", deleteSummary);

export default router;
