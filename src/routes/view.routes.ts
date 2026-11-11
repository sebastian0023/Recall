import express, { Router } from "express";
import { env } from "../config/env.js";
import { googleCallback, googleStart } from "../controllers/google.controller.js";
import {
    forgotPasswordForm,
    forgotPasswordView,
    home,
    login,
    loginForm,
    logout,
    noticeFromQuery,
    recordingDetail,
    recordingList,
    register,
    registerForm,
    resendVerificationView,
    resetPasswordForm,
    resetPasswordView,
    userList,
    verifyEmailPage,
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

router.use(noticeFromQuery);

router.get("/login", loginForm);
router.post("/login", express.urlencoded({ extended: false }), login);
router.get("/register", registerForm);
router.post("/register", express.urlencoded({ extended: false }), register);
router.post("/logout", logout);
router.get("/forgot-password", forgotPasswordForm);
router.post("/forgot-password", express.urlencoded({ extended: false }), forgotPasswordView);
router.get("/reset-password", resetPasswordForm);
router.post("/reset-password", express.urlencoded({ extended: false }), resetPasswordView);
router.get("/verify-email", verifyEmailPage);
router.post("/resend-verification", viewAuth, resendVerificationView);

/**
 * @openapi
 * /auth/google:
 *   servers:
 *     - url: /
 *       description: Raíz del servidor (esta ruta está fuera de /api/v1)
 *   get:
 *     tags: [Auth]
 *     operationId: googleStart
 *     summary: Inicia el login con Google
 *     description: |
 *       Ruta pública que **se abre en el navegador** (redirige; no sirve con Try it out). Guarda `state` y `nonce` en una cookie
 *       de 10 minutos y manda al usuario a Google. Si el login con Google no está configurado
 *       (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CALLBACK_URL`), redirige a `/login?error=google_disabled`.
 *     security: []
 *     responses:
 *       302:
 *         description: Redirige a Google, o a `/login?error=google_disabled` si no está configurado
 *         headers:
 *           Location:
 *             description: Destino de la redirección
 *             schema: { type: string }
 *             example: https://accounts.google.com/o/oauth2/v2/auth?client_id=…
 */
router.get("/auth/google", googleStart);

/**
 * @openapi
 * /google_confirm:
 *   servers:
 *     - url: /
 *       description: Raíz del servidor (esta ruta está fuera de /api/v1)
 *   get:
 *     tags: [Auth]
 *     operationId: googleCallback
 *     summary: Callback del login con Google
 *     description: |
 *       La abre Google al terminar el login; no se llama a mano. La ruta sale de `GOOGLE_CALLBACK_URL` (aquí se muestra el valor
 *       de `.env.example`) y solo existe si el login con Google está configurado.
 *
 *       Valida `state` y el id_token de Google (emisor, audiencia, vigencia, nonce y correo verificado). Si ya hay un usuario con ese
 *       correo lo reutiliza; si no, crea uno con rol `USER`, sin contraseña y con el correo verificado. Abre la misma sesión
 *       (cookie `recall_session`) que el login con contraseña.
 *     security: []
 *     parameters:
 *       - { name: code, in: query, required: false, description: Código de autorización que manda Google, schema: { type: string } }
 *       - { name: state, in: query, required: false, description: Debe coincidir con el `state` de la cookie, schema: { type: string } }
 *       - { name: error, in: query, required: false, description: Lo manda Google si el usuario cancela, schema: { type: string } }
 *     responses:
 *       302:
 *         description: |
 *           Redirige a `/` con la cookie de sesión, o a `/login?error=<código>` donde el código es `google_denied`,
 *           `google_state`, `google_failed` o `google_unverified`.
 *         headers:
 *           Location:
 *             description: Destino de la redirección
 *             schema: { type: string }
 *             example: /
 *           Set-Cookie:
 *             description: Cookie de sesión `recall_session` (httpOnly), solo cuando el login sale bien
 *             schema: { type: string }
 */
if (env.GOOGLE_ENABLED) router.get(googleCallbackPath(), googleCallback);

router.get("/", viewAuth, home);
router.use(["/recordings", "/users"], viewAuth);
router.get("/recordings", validate({ query: listRecordingsQuery }), recordingList);
router.get("/recordings/:id", validate({ params: idParams }), recordingDetail);
router.get("/users", requireRole("ADMIN"), userList);

router.use(["/recordings", "/users"], viewNotFound);
router.use(viewErrorHandler);

export default router;
