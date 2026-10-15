import type { Request, Response } from "express";
import { dummyTranscriptions } from "../models/transcription.model.js";

export function getTranscriptions(_req: Request, res: Response) {
  res.json({ data: dummyTranscriptions, message: "Transcriptions list (dummy)" });
}

export function getTranscriptionById(req: Request, res: Response) {
  const transcription = { ...dummyTranscriptions[0], id: req.params.id };

  res.json({ data: transcription, message: "Transcription detail (dummy)" });
}

export function createTranscription(req: Request, res: Response) {
  const transcription = {
    ...dummyTranscriptions[0],
    ...req.body,
    id: crypto.randomUUID(),
  };

  res.status(201).json({ data: transcription, message: "Transcription created (dummy)" });
}

export function updateTranscription(req: Request, res: Response) {
  const transcription = { ...dummyTranscriptions[0], ...req.body, id: req.params.id };

  res.json({ data: transcription, message: "Transcription updated (dummy)" });
}

export function deleteTranscription(_req: Request, res: Response) {
  res.status(204).send();
}
