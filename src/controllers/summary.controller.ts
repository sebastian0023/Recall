import type { Request, Response } from "express";
import { dummySummaries } from "../models/summary.model.js";

export function getSummaries(_req: Request, res: Response) {
  res.json({ data: dummySummaries, message: "Summaries list (dummy)" });
}

export function getSummaryById(req: Request, res: Response) {
  const summary = { ...dummySummaries[0], id: req.params.id };

  res.json({ data: summary, message: "Summary detail (dummy)" });
}

export function createSummary(req: Request, res: Response) {
  const summary = { ...dummySummaries[0], ...req.body, id: crypto.randomUUID() };

  res.status(201).json({ data: summary, message: "Summary created (dummy)" });
}

export function updateSummary(req: Request, res: Response) {
  const summary = { ...dummySummaries[0], ...req.body, id: req.params.id };

  res.json({ data: summary, message: "Summary updated (dummy)" });
}

export function deleteSummary(_req: Request, res: Response) {
  res.status(204).send();
}
