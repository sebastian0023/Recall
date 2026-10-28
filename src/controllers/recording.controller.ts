import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { prisma } from "../lib/prisma.js";
import type { CreateRecordInput, RecordingStatus, UpdateRecordInput } from "../models/recording.model.js";
import { toPublicUser } from "../models/user.model.js";

async function findRecordingOr404(id: string) {
    const recording = await prisma.recording.findUnique({
        where: { id },
        include: {
            user: true,
            transcription: true,
            summaries: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!recording) throw new ApiError(404, "Recording not found");
    return recording;
}

// Nunca se expone cognitoSub del usuario relacionado
function toPublicRecording<T extends { user?: Parameters<typeof toPublicUser>[0] }>(recording: T) {
    return recording.user ? { ...recording, user: toPublicUser(recording.user) } : recording;
}

export async function getRecordings(_req: Request, res: Response) {
    // Filtros opcionales ya validados por el middleware (?status=&userId=)
    const { status, userId } = res.locals.query as { status?: RecordingStatus; userId?: string };
    const recordings = await prisma.recording.findMany({
        where: { status, userId },
        orderBy: { createdAt: "desc" },
        include: {
            user: true,
            _count: { select: { summaries: true } },
        },
    });

    res.status(200).json({
        data: recordings.map(toPublicRecording),
        message: "Recordings list",
    });
}

export async function getRecordingById(req: Request, res: Response) {
    const recording = await findRecordingOr404(req.params.id as string);

    res.status(200).json({
        data: toPublicRecording(recording),
        message: "Recording found",
    });
}

// Rutas anidadas: GET /recordings/:id/summaries y GET /recordings/:id/transcription
export async function getRecordingSummaries(req: Request, res: Response) {
    const recording = await findRecordingOr404(req.params.id as string);

    res.status(200).json({
        data: recording.summaries,
        message: "Recording summaries",
    });
}

export async function getRecordingTranscription(req: Request, res: Response) {
    const recording = await findRecordingOr404(req.params.id as string);
    if (!recording.transcription) throw new ApiError(404, "Transcription not found");

    res.status(200).json({
        data: recording.transcription,
        message: "Recording transcription",
    });
}

export async function createRecording(req: Request, res: Response) {
    const { userId, title, s3Key, durationSec } = req.body as CreateRecordInput;

    const owner = await prisma.user.findUnique({ where: { id: userId } });
    if (!owner) throw new ApiError(404, "User not found");

    const recording = await prisma.recording.create({
        data: { userId, title, s3Key, durationSec },
    });

    res.status(201).json({
        data: recording,
        message: "Recording created",
    });
}

export async function updateRecording(req: Request, res: Response) {
    const { title, s3Key, durationSec, status, errorMessage } = req.body as UpdateRecordInput;

    const recording = await prisma.recording.update({
        where: { id: req.params.id as string },
        data: { title, s3Key, durationSec, status, errorMessage },
    });

    res.status(200).json({
        data: recording,
        message: "Recording updated",
    });
}

// Política de borrado: borrado físico en cascada hecho en el código (sin triggers ni ON DELETE CASCADE).
// Se eliminan summaries y transcription de la grabación y luego la grabación, todo en una transacción.
export async function deleteRecording(req: Request, res: Response) {
    const id = req.params.id as string;
    await findRecordingOr404(id);

    await prisma.$transaction([
        prisma.summary.deleteMany({ where: { recordingId: id } }),
        prisma.transcription.deleteMany({ where: { recordingId: id } }),
        prisma.recording.delete({ where: { id } }),
    ]);

    res.status(204).send();
}

// Mientras no exista la integración con Amazon Transcribe solo se marca la grabación como en proceso
export async function processRecording(req: Request, res: Response) {
    const recording = await prisma.recording.update({
        where: { id: req.params.id as string },
        data: { status: "PROCESSING", transcribeJobId: `job-${randomUUID()}`, errorMessage: null },
    });

    res.status(202).json({
        data: recording,
        message: "Recording processing started",
    });
}
