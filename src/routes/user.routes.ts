import { Router } from "express";
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { updateUserBody } from "../schemas/user.schema.js";

const router = Router();

router.use(auth);

router.get("/", getUsers);
router.get("/:id", validate({ params: idParams }), getUserById);
router.patch("/:id", validate({ params: idParams, body: updateUserBody }), updateUser);
router.delete("/:id", validate({ params: idParams }), deleteUser);

export default router;
