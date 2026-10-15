import type { Request, Response } from "express";
import { dummyRecordings } from "../models/recording.model.js";

export function getRecordings(_req: Request, res: Response) {
  res.json({ data: dummyRecordings, message: "Recordings list (dummy)" });
}

export function getRecordingById(req: Request, res: Response) {
  const recording = { ...dummyRecordings[0], id: req.params.id };

  res.json({ data: recording, message: "Recording detail (dummy)" });
}

export function createRecording(req: Request, res: Response) {
  const recording = {
    ...dummyRecordings[0],
    ...req.body,
    id: crypto.randomUUID(),
    status: "UPLOADED",
  };

  res.status(201).json({ data: recording, message: "Recording created (dummy)" });
}

export function updateRecording(req: Request, res: Response) {
  const recording = { ...dummyRecordings[0], ...req.body, id: req.params.id };

  res.json({ data: recording, message: "Recording updated (dummy)" });
}

export function deleteRecording(_req: Request, res: Response) {
  res.status(204).send();
}

export function processRecording(req: Request, res: Response) {
  const recording = {
    ...dummyRecordings[0],
    id: req.params.id,
    status: "PROCESSING",
  };

  res.status(202).json({ data: recording, message: "Recording processing started (dummy)" });
}
