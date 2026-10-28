import type { Request, Response } from "express";
import type { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../lib/apiError.js";
import { prisma } from "../lib/prisma.js";
import type { CreateTranscriptionInput, UpdateTranscriptionInput } from "../models/transcription.model.js";

export async function getTranscriptions(_req: Request, res: Response) {
    // Filtro opcional ya validado por el middleware (?recordingId=)
    const { recordingId } = res.locals.query as { recordingId?: string };
    const transcriptions = await prisma.transcription.findMany({
        where: { recordingId },
        orderBy: { createdAt: "desc" },
        include: { recording: { select: { id: true, title: true, status: true } } },
    });

    res.status(200).json({
        data: transcriptions,
        message: "Transcriptions list",
    });
}

export async function getTranscriptionById(req: Request, res: Response) {
    const transcription = await prisma.transcription.findUnique({
        where: { id: req.params.id as string },
        include: { recording: true },
    });
    if (!transcription) throw new ApiError(404, "Transcription not found");

    res.status(200).json({
        data: transcription,
        message: "Transcription found",
    });
}

export async function createTranscription(req: Request, res: Response) {
    const { recordingId, language, fullText, segments } = req.body as CreateTranscriptionInput;

    const recording = await prisma.recording.findUnique({ where: { id: recordingId } });
    if (!recording) throw new ApiError(404, "Recording not found");

    // Una grabación solo tiene una transcripción: recordingId es único -> P2002 -> 409
    const transcription = await prisma.transcription.create({
        data: { recordingId, language, fullText, segments: segments as Prisma.InputJsonValue | undefined },
    });

    res.status(201).json({
        data: transcription,
        message: "Transcription created",
    });
}

export async function updateTranscription(req: Request, res: Response) {
    const { language, fullText, segments } = req.body as UpdateTranscriptionInput;

    const transcription = await prisma.transcription.update({
        where: { id: req.params.id as string },
        data: { language, fullText, segments: segments as Prisma.InputJsonValue | undefined },
    });

    res.status(200).json({
        data: transcription,
        message: "Transcription updated",
    });
}

export async function deleteTranscription(req: Request, res: Response) {
    // Inexistente -> P2025 -> 404 (errorHandler)
    await prisma.transcription.delete({ where: { id: req.params.id as string } });
    res.status(204).send();
}
