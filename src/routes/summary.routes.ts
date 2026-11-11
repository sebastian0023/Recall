import { Router } from "express";
import {
    createSummary,
    deleteSummary,
    getSummaries,
    getSummaryById,
    updateSummary,
} from "../controllers/summary.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { createSummaryBody, listSummariesQuery, updateSummaryBody } from "../schemas/summary.schema.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /summaries:
 *   get:
 *     tags: [Summaries]
 *     operationId: listSummaries
 *     summary: "Lista los resúmenes"
 *     description: |
 *       Un `USER` solo accede a lo que es suyo; un `ADMIN`, a todo. Cada resumen incluye un resumen de su grabación. Filtros opcionales: `recordingId` y `template`.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/RecordingIdQuery"
 *       - $ref: "#/components/parameters/SummaryTemplateQuery"
 *     responses:
 *       200:
 *         description: "Lista de resúmenes (`message: Summaries list`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/SummaryListEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 */
router.get("/", validate({ query: listSummariesQuery }), getSummaries);
/**
 * @openapi
 * /summaries/{id}:
 *   get:
 *     tags: [Summaries]
 *     operationId: getSummary
 *     summary: "Obtiene un resumen"
 *     description: |
 *       Dueño de la grabación o `ADMIN`. Incluye la grabación completa.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Resumen con su grabación (`message: Summary found`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/SummaryDetailEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", validate({ params: idParams }), getSummaryById);
/**
 * @openapi
 * /summaries:
 *   post:
 *     tags: [Summaries]
 *     operationId: createSummary
 *     summary: "Crea un resumen de una grabación"
 *     description: |
 *       Dueño de la grabación o `ADMIN`.
 *
 *       **Envía el correo "Tu resumen está listo"** al **dueño de la grabación** (no a quien hace la petición: si un administrador crea el resumen, el correo le llega al dueño). Lleva el título, la plantilla, un extracto del contenido y un enlace a la vista de la grabación. Solo se manda si el correo del dueño está verificado; si el envío falla, el resumen se crea igual (201) y queda un `warn` en el log.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/CreateSummaryInput" }
 *     responses:
 *       201:
 *         description: "Resumen creado (`message: Summary created`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/SummaryEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/", validate({ body: createSummaryBody }), createSummary);
/**
 * @openapi
 * /summaries/{id}:
 *   patch:
 *     tags: [Summaries]
 *     operationId: updateSummary
 *     summary: "Actualiza un resumen"
 *     description: |
 *       Dueño de la grabación o `ADMIN`. Se necesita al menos un campo. No manda correo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UpdateSummaryInput" }
 *     responses:
 *       200:
 *         description: "Resumen actualizado (`message: Summary updated`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/SummaryEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.patch("/:id", validate({ params: idParams, body: updateSummaryBody }), updateSummary);
/**
 * @openapi
 * /summaries/{id}:
 *   delete:
 *     tags: [Summaries]
 *     operationId: deleteSummary
 *     summary: "Elimina un resumen"
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
router.delete("/:id", validate({ params: idParams }), deleteSummary);

export default router;
