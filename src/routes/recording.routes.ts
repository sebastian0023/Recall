import { Router } from "express";
import {
    createRecording,
    deleteRecording,
    getRecordingById,
    getRecordings,
    getRecordingSummaries,
    getRecordingTranscription,
    processRecording,
    updateRecording,
} from "../controllers/recording.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireVerifiedEmail } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { createRecordingBody, listRecordingsQuery, updateRecordingBody } from "../schemas/recording.schema.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /recordings:
 *   get:
 *     tags: [Recordings]
 *     operationId: listRecordings
 *     summary: "Lista las grabaciones"
 *     description: |
 *       Un `USER` solo accede a lo que es suyo; un `ADMIN`, a todo. Cada grabación incluye su dueño y el número de resúmenes. Filtros opcionales: `status` y `userId` (un `USER` que pide el `userId` de otro recibe 403).
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/RecordingStatusQuery"
 *       - $ref: "#/components/parameters/RecordingOwnerQuery"
 *     responses:
 *       200:
 *         description: "Lista de grabaciones, de la más reciente a la más antigua (`message: Recordings list`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingListEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 */
router.get("/", validate({ query: listRecordingsQuery }), getRecordings);
/**
 * @openapi
 * /recordings/{id}:
 *   get:
 *     tags: [Recordings]
 *     operationId: getRecording
 *     summary: "Obtiene una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Incluye el dueño, la transcripción (`null` si todavía no tiene) y los resúmenes. Un id que no existe responde 404 antes de revisar al dueño.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Grabación con su dueño, transcripción y resúmenes (`message: Recording found`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingDetailEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", validate({ params: idParams }), getRecordingById);
/**
 * @openapi
 * /recordings/{id}/summaries:
 *   get:
 *     tags: [Recordings]
 *     operationId: listRecordingSummaries
 *     summary: "Lista los resúmenes de una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Del más antiguo al más reciente.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Resúmenes de la grabación (`message: Recording summaries`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingSummariesEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id/summaries", validate({ params: idParams }), getRecordingSummaries);
/**
 * @openapi
 * /recordings/{id}/transcription:
 *   get:
 *     tags: [Recordings]
 *     operationId: getRecordingTranscription
 *     summary: "Obtiene la transcripción de una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Responde 404 si la grabación no existe o todavía no tiene transcripción.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Transcripción de la grabación (`message: Recording transcription`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingTranscriptionEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id/transcription", validate({ params: idParams }), getRecordingTranscription);
/**
 * @openapi
 * /recordings:
 *   post:
 *     tags: [Recordings]
 *     operationId: createRecording
 *     summary: "Crea una grabación"
 *     description: |
 *       Exige tener el **correo verificado**: si no, responde 403 con `code: EMAIL_NOT_VERIFIED`.
 *
 *       `userId` es opcional: sin él, la grabación queda a nombre de quien la crea. Un `USER` que envía el `userId` de otro recibe 403; un `ADMIN` puede crearla para cualquier usuario (404 si ese usuario no existe). Queda en estado `UPLOADED`.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/CreateRecordingInput" }
 *     responses:
 *       201:
 *         description: "Grabación creada (`message: Recording created`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/RecordingForbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/", requireVerifiedEmail, validate({ body: createRecordingBody }), createRecording);
/**
 * @openapi
 * /recordings/{id}:
 *   patch:
 *     tags: [Recordings]
 *     operationId: updateRecording
 *     summary: "Actualiza una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Se necesita al menos un campo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UpdateRecordingInput" }
 *     responses:
 *       200:
 *         description: "Grabación actualizada (`message: Recording updated`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id", validate({ params: idParams, body: updateRecordingBody }), updateRecording);
/**
 * @openapi
 * /recordings/{id}:
 *   delete:
 *     tags: [Recordings]
 *     operationId: deleteRecording
 *     summary: "Elimina una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Borra también su transcripción y sus resúmenes, todo en una transacción.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       204: { $ref: "#/components/responses/NoContent" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.delete("/:id", validate({ params: idParams }), deleteRecording);
/**
 * @openapi
 * /recordings/{id}/process:
 *   post:
 *     tags: [Recordings]
 *     operationId: processRecording
 *     summary: "Inicia el procesamiento de una grabación"
 *     description: |
 *       Dueño o `ADMIN`. Exige tener el **correo verificado**: si no, responde 403 con `code: EMAIL_NOT_VERIFIED`.
 *
 *       Marca la grabación como `PROCESSING` y guarda un `transcribeJobId`; la transcripción real llega en una entrega posterior.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       202:
 *         description: "Procesamiento iniciado: la grabación queda en `PROCESSING` (`message: Recording processing started`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/RecordingEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/RecordingForbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/:id/process", requireVerifiedEmail, validate({ params: idParams }), processRecording);

export default router;
