import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginBody, registerBody } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validate({ body: registerBody }), register);
router.post("/login", validate({ body: loginBody }), login);
router.get("/me", requireAuth, me);

export default router;
