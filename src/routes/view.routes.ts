import express, { Router } from "express";
import {
    home,
    login,
    loginForm,
    logout,
    recordingDetail,
    recordingList,
    userList,
    viewErrorHandler,
    viewNotFound,
} from "../controllers/view.controller.js";
import { viewAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { listRecordingsQuery } from "../schemas/recording.schema.js";

const router = Router();

router.get("/login", loginForm);
router.post("/login", express.urlencoded({ extended: false }), login);
router.post("/logout", logout);

router.get("/", viewAuth, home);
router.use(["/recordings", "/users"], viewAuth);
router.get("/recordings", validate({ query: listRecordingsQuery }), recordingList);
router.get("/recordings/:id", validate({ params: idParams }), recordingDetail);
router.get("/users", requireRole("ADMIN"), userList);

router.use(["/recordings", "/users"], viewNotFound);
router.use(viewErrorHandler);

export default router;
