import { Router } from "express";
import {
    home,
    recordingDetail,
    recordingList,
    userList,
    viewErrorHandler,
    viewNotFound,
} from "../controllers/view.controller.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { listRecordingsQuery } from "../schemas/recording.schema.js";

const router = Router();

router.get("/", home);
router.get("/recordings", validate({ query: listRecordingsQuery }), recordingList);
router.get("/recordings/:id", validate({ params: idParams }), recordingDetail);
router.get("/users", userList);

router.use(["/recordings", "/users"], viewNotFound);
router.use(viewErrorHandler);

export default router;
