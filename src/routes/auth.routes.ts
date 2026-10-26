import { Router } from "express";
import { confirm, login, me, register } from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { confirmBody, loginBody, registerBody } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validate({ body: registerBody }), register);
router.post("/confirm", validate({ body: confirmBody }), confirm);
router.post("/login", validate({ body: loginBody }), login);
router.get("/me", auth, me);

export default router;
