import { Router } from "express";
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";
import { requireRole, requireSelfOrAdmin } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { updateUserBody } from "../schemas/user.schema.js";

const router = Router();

router.use(auth);

router.get("/", requireRole("ADMIN"), getUsers);
router.get("/:id", validate({ params: idParams }), requireSelfOrAdmin, getUserById);
router.patch("/:id", validate({ params: idParams, body: updateUserBody }), requireSelfOrAdmin, updateUser);
router.delete("/:id", validate({ params: idParams }), requireRole("ADMIN"), deleteUser);

export default router;
