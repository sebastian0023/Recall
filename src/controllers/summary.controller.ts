import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { dummySummaries, type CreateSummaryInput, type Summary, type UpdateSummaryInput } from "../models/summary.model.js";

function findSummary(id: string): Summary {
    return dummySummaries.find((s) => s.id === id) ?? { ...dummySummaries[0]!, id };
}

export function getSummaries(_req: Request, res: Response) {
    res.status(200).json({
        data: dummySummaries,
        message: "Summaries list"
    });
}

export function getSummaryById(req: Request, res: Response) {
    res.status(200).json({
        data: findSummary(req.params.id as string),
        message: "Summary found"
    });
}

export function createSummary(req: Request, res: Response) {
    const { recordingId, template } = req.body as CreateSummaryInput;
    const now = new Date();

    const summary: Summary = {
        id: randomUUID(),
        recordingId,
        template,
        content: "Resumen generado automáticamente",
        createdAt: now,
        updatedAt: now,
    };

    res.status(201).json({
        data: summary,
        message: "Summary created",
    });
}

export function updateSummary(req: Request, res: Response) {
    const changes = req.body as UpdateSummaryInput;
    const summary = findSummary(req.params.id as string);

    res.status(200).json({
        data: { ...summary, ...changes, updatedAt: new Date() },
        message: "Summary updated",
    });
}

export function deleteSummary(_req: Request, res: Response) {
    res.status(204).send();
}