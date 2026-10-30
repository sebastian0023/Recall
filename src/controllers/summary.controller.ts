import type { Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { assertCanAccess, currentUser, isAdmin } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";
import type { CreateSummaryInput, SummaryTemplate, UpdateSummaryInput } from "../models/summary.model.js";

async function findSummaryOr404(id: string, res: Response) {
    const summary = await prisma.summary.findUnique({
        where: { id },
        include: { recording: true },
    });
    if (!summary) throw new ApiError(404, "Summary not found");
    assertCanAccess(currentUser(res), summary.recording.userId);
    return summary;
}

export async function getSummaries(_req: Request, res: Response) {
    // Filtros opcionales ya validados por el middleware (?recordingId=&template=)
    const { recordingId, template } = res.locals.query as { recordingId?: string; template?: SummaryTemplate };
    const user = currentUser(res);
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
    const summary = await findSummaryOr404(req.params.id as string, res);

    res.status(200).json({
        data: summary,
        message: "Summary found",
    });
}

export async function createSummary(req: Request, res: Response) {
    const { recordingId, template, content } = req.body as CreateSummaryInput;

    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
    if (!recording) throw new ApiError(404, "Recording not found");
    assertCanAccess(currentUser(res), recording.userId);

    const summary = await prisma.summary.create({
        data: { recordingId, template, content },
    });

    res.status(201).json({
        data: summary,
        message: "Summary created",
    });
}

export async function updateSummary(req: Request, res: Response) {
    const { template, content } = req.body as UpdateSummaryInput;
    const id = req.params.id as string;
    await findSummaryOr404(id, res);

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
    await findSummaryOr404(id, res);

    await prisma.summary.delete({ where: { id } });
    res.status(204).send();
}
