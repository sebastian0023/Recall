import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { dummyRecordings, type CreateRecordInput, type Recording, type UpdateRecordInput, } from "../models/recording.model.js";

function findRecording(id: string): Recording {
    return dummyRecordings.find((r) => r.id === id) ?? { ...dummyRecordings[0]!, id };
}

export function getRecordings(_req: Request, res: Response) {
    res.status(200).json({
        data: dummyRecordings,
        message: "Recordings list",
    });
}

export function getRecordingById(req: Request, res: Response) {
    res.status(200).json({
        data: findRecording(req.params.id as string),
        message: "Recording found",
    });
}

export function createRecording(req: Request, res: Response) {
    const { title, s3Key } = req.body as CreateRecordInput;
    const authUser = res.locals.user as { id: string } | undefined;
    const now = new Date();

    const recording: Recording = {
        id: randomUUID(),
        userId: authUser?.id ?? dummyRecordings[0]!.userId,
        title: title ?? "",
        s3Key: s3Key ?? "",
        durationSec: null,
        status: "UPLOADED",
        transcribeJobId: null,
        errorMessage: null,
        createdAt: now,
        updatedAt: now
    };

    res.status(201).json({
        data: recording,
        message: "Recording created"
    });
}

export function updateRecording(req: Request, res: Response) {
    const changes = req.body as UpdateRecordInput;
    const recording = findRecording(req.params.id as string);

    res.status(200).json({
        data: { ...recording, ...changes, updatedAt: new Date() },
        message: "Recording updated"
    });
}

export function deleteRecording(_req: Request, res: Response) {
    res.status(204).send();
}

export function processRecording(req: Request, res: Response) {
    const recording = findRecording(req.params.id as string);

    res.status(202).json({
        data: {
            ...recording,
            status: "PROCESSING",
            transcribeJobId: `job-${randomUUID()}`,
            updatedAt: new Date(),
        }, 
        message: "Recording processing started"
    });
}