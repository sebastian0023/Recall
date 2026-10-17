import { Router } from "express";
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.js";

const router = Router();

router.use(auth);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
