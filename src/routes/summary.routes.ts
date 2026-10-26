import { Router } from "express";
import {
    createSummary,
    deleteSummary,
    getSummaries,
    getSummaryById,
    updateSummary,
} from "../controllers/summary.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { createSummaryBody, listSummariesQuery, updateSummaryBody } from "../schemas/summary.schema.js";

const router = Router();

router.use(auth);

router.get("/", validate({ query: listSummariesQuery }), getSummaries);
router.get("/:id", validate({ params: idParams }), getSummaryById);
router.post("/", validate({ body: createSummaryBody }), createSummary);
router.patch("/:id", validate({ params: idParams, body: updateSummaryBody }), updateSummary);
router.delete("/:id", validate({ params: idParams }), deleteSummary);

export default router;
