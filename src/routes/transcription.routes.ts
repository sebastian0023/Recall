import { Router } from "express";
import {
    createTranscription,
    deleteTranscription,
    getTranscriptionById,
    getTranscriptions,
    updateTranscription,
} from "../controllers/transcription.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import {
    createTranscriptionBody,
    listTranscriptionsQuery,
    updateTranscriptionBody,
} from "../schemas/transcription.schema.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /transcriptions:
 *   get:
 *     tags: [Transcriptions]
 *     operationId: listTranscriptions
 *     summary: "Lista las transcripciones"
 *     description: |
 *       Un `USER` solo accede a lo que es suyo; un `ADMIN`, a todo. Cada transcripción incluye un resumen de su grabación. Filtro opcional: `recordingId`.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/RecordingIdQuery"
 *     responses:
 *       200:
 *         description: "Lista de transcripciones (`message: Transcriptions list`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TranscriptionListEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/", validate({ query: listTranscriptionsQuery }), getTranscriptions);
/**
 * @openapi
 * /transcriptions/{id}:
 *   get:
 *     tags: [Transcriptions]
 *     operationId: getTranscription
 *     summary: "Obtiene una transcripción"
 *     description: |
 *       Dueño de la grabación o `ADMIN`. Incluye la grabación completa.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Transcripción con su grabación (`message: Transcription found`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TranscriptionDetailEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", validate({ params: idParams }), getTranscriptionById);
/**
 * @openapi
 * /transcriptions:
 *   post:
 *     tags: [Transcriptions]
 *     operationId: createTranscription
 *     summary: "Crea la transcripción de una grabación"
 *     description: |
 *       Dueño de la grabación o `ADMIN`. Una grabación solo puede tener **una** transcripción (409 si ya tiene). `language` es opcional (por defecto `es-US`).
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/CreateTranscriptionInput" }
 *     responses:
 *       201:
 *         description: "Transcripción creada (`message: Transcription created`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TranscriptionEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 *       409:
 *         description: "La grabación ya tiene una transcripción"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *             example: { error: { message: "Resource already exists", requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 */
router.post("/", validate({ body: createTranscriptionBody }), createTranscription);
/**
 * @openapi
 * /transcriptions/{id}:
 *   patch:
 *     tags: [Transcriptions]
 *     operationId: updateTranscription
 *     summary: "Actualiza una transcripción"
 *     description: |
 *       Dueño de la grabación o `ADMIN`. Se necesita al menos un campo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UpdateTranscriptionInput" }
 *     responses:
 *       200:
 *         description: "Transcripción actualizada (`message: Transcription updated`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/TranscriptionEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id", validate({ params: idParams, body: updateTranscriptionBody }), updateTranscription);
/**
 * @openapi
 * /transcriptions/{id}:
 *   delete:
 *     tags: [Transcriptions]
 *     operationId: deleteTranscription
 *     summary: "Elimina una transcripción"
 *     description: |
 *       Dueño de la grabación o `ADMIN`.
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
router.delete("/:id", validate({ params: idParams }), deleteTranscription);

export default router;
