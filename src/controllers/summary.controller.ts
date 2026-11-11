import type { Request, Response } from "express";
import type { Logger } from "pino";
import { ApiError } from "../lib/apiError.js";
import { appLink } from "../lib/appLink.js";
import { assertCanAccess, currentUser, isAdmin } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";
import type { CreateSummaryInput, SummaryTemplate, UpdateSummaryInput } from "../models/summary.model.js";
import { sendSummaryReadyEmail } from "../services/mail.service.js";

async function findSummaryOr404(id: string, req: Request) {
    const summary = await prisma.summary.findUnique({
        where: { id },
        include: { recording: true },
    });
    if (!summary) throw new ApiError(404, "Summary not found");
    assertCanAccess(currentUser(req), summary.recording.userId);
    return summary;
}

export async function getSummaries(req: Request, res: Response) {
    // Filtros opcionales ya validados por el middleware (?recordingId=&template=)
    const { recordingId, template } = res.locals.query as { recordingId?: string; template?: SummaryTemplate };
    const user = currentUser(req);
    const summaries = await prisma.summary.findMany({
        where: { recordingId, template, recording: isAdmin(user) ? undefined : { userId: user.id } },
        orderBy: { createdAt: "desc" },
        include: { recording: { select: { id: true, title: true, status: true } } },
    });

    res.status(200).json({
        data: summaries,
        message: "Summaries list",
    });
}

export async function getSummaryById(req: Request, res: Response) {
    const summary = await findSummaryOr404(req.params.id as string, req);

    res.status(200).json({
        data: summary,
        message: "Summary found",
    });
}

// Avisa al DUEÑO de la grabación (no a quien hace la petición: si un admin crea el resumen, le llega al dueño).
// Solo a correos verificados, para no escribirle a alguien que no confirmó que la dirección es suya.
// El resumen ya está creado: si el correo falla no cambia la respuesta (el servicio deja un warn)
async function notifySummaryReady(
    recording: { id: string; title: string; user: { id: string; email: string; name: string; emailVerified: boolean } },
    summary: { template: string; content: string },
    log: Logger,
) {
    const owner = recording.user;
    if (!owner.emailVerified) {
        log.info({ mail: "summary-ready", userId: owner.id }, "Email skipped: address not verified");
        return;
    }
    await sendSummaryReadyEmail(owner, recording, summary, appLink(`/recordings/${recording.id}`), log);
}

export async function createSummary(req: Request, res: Response) {
    const { recordingId, template, content } = req.body as CreateSummaryInput;

    const recording = await prisma.recording.findUnique({ where: { id: recordingId }, include: { user: true } });
    if (!recording) throw new ApiError(404, "Recording not found");
    assertCanAccess(currentUser(req), recording.userId);

    const summary = await prisma.summary.create({
        data: { recordingId, template, content },
    });
    await notifySummaryReady(recording, summary, req.log);

    res.status(201).json({
        data: summary,
        message: "Summary created",
    });
}

export async function updateSummary(req: Request, res: Response) {
    const { template, content } = req.body as UpdateSummaryInput;
    const id = req.params.id as string;
    await findSummaryOr404(id, req);

    const summary = await prisma.summary.update({
        where: { id },
        data: { template, content },
    });

    res.status(200).json({
        data: summary,
        message: "Summary updated",
    });
}

export async function deleteSummary(req: Request, res: Response) {
    const id = req.params.id as string;
    await findSummaryOr404(id, req);

    await prisma.summary.delete({ where: { id } });
    res.status(204).send();
}
