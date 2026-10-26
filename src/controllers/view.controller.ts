import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { prisma } from "../lib/prisma.js";
import type { RecordingStatus } from "../models/recording.model.js";

const STATUSES: RecordingStatus[] = ["UPLOADED", "PROCESSING", "DONE", "FAILED"];

export async function home(_req: Request, res: Response) {
    const [users, recordings, transcriptions, summaries, latest] = await Promise.all([
        prisma.user.count(),
        prisma.recording.count(),
        prisma.transcription.count(),
        prisma.summary.count(),
        prisma.recording.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { user: true } }),
    ]);

    res.render("home", {
        title: "Inicio",
        counts: { users, recordings, transcriptions, summaries },
        latest,
    });
}

export async function recordingList(_req: Request, res: Response) {
    const { status, userId } = res.locals.query as { status?: RecordingStatus; userId?: string };
    const recordings = await prisma.recording.findMany({
        where: { status, userId },
        orderBy: { createdAt: "desc" },
        include: { user: true, _count: { select: { summaries: true } }, transcription: { select: { id: true } } },
    });

    res.render("recordings/list", {
        title: "Grabaciones",
        recordings,
        statuses: STATUSES.map((value) => ({ value, selected: value === status })),
        status,
    });
}

export async function recordingDetail(req: Request, res: Response) {
    const recording = await prisma.recording.findUnique({
        where: { id: req.params.id as string },
        include: {
            user: true,
            transcription: true,
            summaries: { orderBy: { createdAt: "asc" } },
        },
    });
    if (!recording) throw new ApiError(404, "La grabación no existe");

    res.render("recordings/detail", { title: recording.title, recording });
}

export async function userList(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { recordings: true } } },
    });

    res.render("users/list", { title: "Usuarios", users });
}

export function viewNotFound(_req: Request, _res: Response, next: NextFunction) {
    next(new ApiError(404, "La página no existe"));
}

export function viewErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    const status = err instanceof ApiError ? err.status : 500;
    if (status === 500) console.error(err);

    res.status(status).render("error", {
        title: `Error ${status}`,
        status,
        message: err instanceof ApiError ? err.message : "Ocurrió un error inesperado",
        details: err instanceof ApiError ? err.details : undefined,
    });
}
