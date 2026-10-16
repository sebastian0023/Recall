import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { dummyTranscription, type CreateTranscriptionInput, type Transcription, type UpdateTranscriptionInput } from "../models/transcription.model.js";

function findTranscription(id: string): Transcription {
    return (
        dummyTranscription.find((t) => t.id === id) ?? { ...dummyTranscription[0]!, id }
    );
}

export function getTranscriptions(_req: Request, res: Response) {
    res.status(200).json({
        data: dummyTranscription,
        message: "Transcriptions list",
    });
}

export function getTranscriptionById(req: Request, res: Response) {
    res.status(200).json({
        data: findTranscription(req.params.id as string),
        message: "Transcription found",
    });
}

export function createTranscription(req: Request, res: Response) {
    const { recordingId, fullText, segments } = req.body as CreateTranscriptionInput;
    const now = new Date();

    const transcription: Transcription = {
        id: randomUUID(),
        recordingId,
        language: "es-US",
        fullText,
        segments: segments ?? null,
        createdAt: now,
        updatedAt: now,
    };

    res.status(201).json({
        data: transcription,
        message: "Transcription created",
    });
}

export function updateTranscription(req: Request, res: Response) {
    const changes = req.body as UpdateTranscriptionInput;
    const transcription = findTranscription(req.params.id as string);

    res.status(200).json({
        data: { ...transcription, ...changes, updatedAt: new Date() },
        message: "Transcription updated",
    });
}

export function deleteTranscription(_req: Request, res: Response) {
    res.status(204).send();
}