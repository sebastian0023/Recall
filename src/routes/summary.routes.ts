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

router.get("/", validate({ query: listSummariesQuery }), getSummaries);
router.get("/:id", validate({ params: idParams }), getSummaryById);
/**
 * @openapi
 * /summaries:
 *   post:
 *     tags: [Summaries]
 *     operationId: createSummary
 *     summary: Crea un resumen de una grabación
 *     description: |
 *       Requiere sesión. El dueño de la grabación o un administrador pueden crearlo.
 *
 *       **Envía el correo "Tu resumen está listo"** al **dueño de la grabación** (no a quien hace la petición: si un
 *       administrador crea el resumen, el correo le llega al dueño). Lleva el título, la plantilla, un extracto del contenido
 *       y un enlace a la vista de la grabación. Solo se manda si el correo del dueño está verificado; si el envío falla,
 *       el resumen se crea igual (201) y queda un `warn` en el log.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recordingId, template, content]
 *             additionalProperties: false
 *             properties:
 *               recordingId: { type: string, format: uuid, example: "22222222-2222-4222-8222-000000000005" }
 *               template: { $ref: "#/components/schemas/SummaryTemplate" }
 *               content: { type: string, minLength: 1, maxLength: 20000, example: "Acuerdos con el asesor: justificar la muestra y entregar el marco teórico." }
 *     responses:
 *       201:
 *         description: Resumen creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, message]
 *               properties:
 *                 data: { $ref: "#/components/schemas/Summary" }
 *                 message: { type: string, example: Summary created }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.post("/", validate({ body: createSummaryBody }), createSummary);
router.patch("/:id", validate({ params: idParams, body: updateSummaryBody }), updateSummary);
router.delete("/:id", validate({ params: idParams }), deleteSummary);

export default router;
