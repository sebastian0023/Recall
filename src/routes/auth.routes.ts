import { Router } from "express";
import {
    login,
    me,
    register,
    resendVerificationHandler,
    verifyEmailHandler,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { loginBody, registerBody, verifyEmailBody } from "../schemas/auth.schema.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     operationId: register
 *     summary: Crea una cuenta
 *     description: |
 *       Ruta pública. Siempre crea un usuario con rol `USER` (enviar `role` responde 400) y con el correo sin verificar.
 *       Manda un correo con el enlace de verificación; si el correo no sale, la cuenta se crea igual.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             additionalProperties: false
 *             properties:
 *               email: { type: string, format: email, maxLength: 254, example: nuevo@recall.app }
 *               password: { type: string, minLength: 8, maxLength: 72, format: password, example: Recall2026! }
 *               name: { type: string, minLength: 1, maxLength: 100, example: Nuevo Usuario }
 *     responses:
 *       201:
 *         description: Cuenta creada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { $ref: "#/components/schemas/User" }
 *                 message: { type: string, example: user registered }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       409: { $ref: "#/components/responses/Conflict" }
 */
router.post("/register", validate({ body: registerBody }), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     operationId: login
 *     summary: Inicia sesión
 *     description: Ruta pública. Si el correo no existe o la contraseña es incorrecta responde el mismo 401, para no revelar qué correos están registrados.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             additionalProperties: false
 *             properties:
 *               email: { type: string, format: email, maxLength: 254, example: ana.lopez@recall.app }
 *               password: { type: string, minLength: 1, format: password, example: Recall2026! }
 *     responses:
 *       200:
 *         description: Sesión iniciada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { $ref: "#/components/schemas/Session" }
 *                 message: { type: string, example: Login successful }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.post("/login", validate({ body: loginBody }), login);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     operationId: getMe
 *     summary: Usuario de la sesión actual
 *     description: Requiere sesión. Incluye `emailVerified`.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { $ref: "#/components/schemas/User" }
 *                 message: { type: string, example: Authenticated user }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/me", requireAuth, me);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     operationId: verifyEmail
 *     summary: Verifica el correo con el token del enlace
 *     description: |
 *       Ruta pública (el token ya identifica al usuario). El token es de un solo uso y vence con `VERIFY_TOKEN_TTL`.
 *       Un token inválido, expirado o ya usado responde 400 con un mensaje claro (`Invalid token`, `Token expired` o `Token already used`).
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             additionalProperties: false
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: "^[0-9a-f]{64}$"
 *                 description: Token que viene en el enlace del correo (parámetro `token`)
 *                 example: 9f2c4a7e1b3d5f6a8c0e2b4d6f8a1c3e5b7d9f0a2c4e6b8d0f1a3c5e7b9d1f3a
 *     responses:
 *       200:
 *         description: Correo verificado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { $ref: "#/components/schemas/User" }
 *                 message: { type: string, example: Email verified }
 *       400:
 *         description: El body es inválido o el token es inválido, expiró o ya se usó
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *             examples:
 *               tokenUsed:
 *                 summary: Token ya usado
 *                 value: { error: { message: Token already used, requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 *               tokenExpired:
 *                 summary: Token expirado
 *                 value: { error: { message: Token expired, requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 *               invalidBody:
 *                 summary: Token con formato inválido
 *                 value: { error: { message: Invalid data, details: [{ field: token, message: Must be a valid token }], requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 */
router.post("/verify-email", validate({ body: verifyEmailBody }), verifyEmailHandler);

/**
 * @openapi
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     operationId: resendVerification
 *     summary: Reenvía el correo de verificación
 *     description: |
 *       Requiere sesión. Invalida el enlace anterior y manda uno nuevo.
 *       Si el correo ya está verificado responde 200 sin enviar nada.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Correo reenviado, o el correo ya estaba verificado (no se envía nada)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { type: object, nullable: true, example: null }
 *                 message: { type: string, enum: [Verification email sent, Email already verified] }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.post("/resend-verification", requireAuth, resendVerificationHandler);

export default router;
