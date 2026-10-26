import type { Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { prisma } from "../lib/prisma.js";
import type { CreateSummaryInput, SummaryTemplate, UpdateSummaryInput } from "../models/summary.model.js";

export async function getSummaries(_req: Request, res: Response) {
    // Filtros opcionales ya validados por el middleware (?recordingId=&template=)
    const { recordingId, template } = res.locals.query as { recordingId?: string; template?: SummaryTemplate };
    const summaries = await prisma.summary.findMany({
        where: { recordingId, template },
        orderBy: { createdAt: "desc" },
        include: { recording: { select: { id: true, title: true, status: true } } },
    });

    res.status(200).json({
        data: summaries,
        message: "Summaries list",
    });
}

export async function getSummaryById(req: Request, res: Response) {
    const summary = await prisma.summary.findUnique({
        where: { id: req.params.id as string },
        include: { recording: true },
    });
    if (!summary) throw new ApiError(404, "Summary not found");

    res.status(200).json({
        data: summary,
        message: "Summary found",
    });
}

export async function createSummary(req: Request, res: Response) {
    const { recordingId, template, content } = req.body as CreateSummaryInput;

    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
    if (!recording) throw new ApiError(404, "Recording not found");

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

    const summary = await prisma.summary.update({
        where: { id: req.params.id as string },
        data: { template, content },
    });

    res.status(200).json({
        data: summary,
        message: "Summary updated",
    });
}

export async function deleteSummary(req: Request, res: Response) {
    // Inexistente -> P2025 -> 404 (errorHandler)
    await prisma.summary.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
}
