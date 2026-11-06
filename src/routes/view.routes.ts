import express, { Router } from "express";
import { env } from "../config/env.js";
import { googleCallback, googleStart } from "../controllers/google.controller.js";
import {
    home,
    login,
    loginForm,
    logout,
    recordingDetail,
    recordingList,
    register,
    registerForm,
    userList,
    viewErrorHandler,
    viewNotFound,
} from "../controllers/view.controller.js";
import { googleCallbackPath } from "../lib/google.js";
import { viewAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { listRecordingsQuery } from "../schemas/recording.schema.js";

const router = Router();

router.get("/login", loginForm);
router.post("/login", express.urlencoded({ extended: false }), login);
router.get("/register", registerForm);
router.post("/register", express.urlencoded({ extended: false }), register);
router.post("/logout", logout);

router.get("/auth/google", googleStart);
if (env.GOOGLE_ENABLED) router.get(googleCallbackPath(), googleCallback);

router.get("/", viewAuth, home);
router.use(["/recordings", "/users"], viewAuth);
router.get("/recordings", validate({ query: listRecordingsQuery }), recordingList);
router.get("/recordings/:id", validate({ params: idParams }), recordingDetail);
router.get("/users", requireRole("ADMIN"), userList);

router.use(["/recordings", "/users"], viewNotFound);
router.use(viewErrorHandler);

export default router;
