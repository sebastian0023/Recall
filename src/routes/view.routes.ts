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

// Rutas de las vistas (HTML). El API JSON vive aparte bajo /api/v1
const router = Router();

router.get("/", home);
router.get("/recordings", validate({ query: listRecordingsQuery }), recordingList);
router.get("/recordings/:id", validate({ params: idParams }), recordingDetail);
router.get("/users", userList);

// Solo para las rutas de vistas; el resto sigue al notFound/errorHandler JSON del API
router.use(["/recordings", "/users"], viewNotFound);
router.use(viewErrorHandler);

export default router;
