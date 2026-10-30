import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { assertCanAccess, currentUser, isAdmin } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";
import { SESSION_COOKIE } from "../middlewares/auth.js";
import type { RecordingStatus } from "../models/recording.model.js";
import { loginBody } from "../schemas/auth.schema.js";
import { authenticate } from "./auth.controller.js";

const STATUSES: RecordingStatus[] = ["UPLOADED", "PROCESSING", "DONE", "FAILED"];

export function loginForm(req: Request, res: Response) {
    if ((req.cookies as Record<string, string | undefined>)[SESSION_COOKIE]) {
        res.redirect("/");
        return;
    }
    res.render("login", { title: "Iniciar sesión" });
}

export async function login(req: Request, res: Response) {
    const input = loginBody.safeParse(req.body);
    if (!input.success) {
        res.status(400).render("login", { title: "Iniciar sesión", error: "Escribe un correo válido y tu contraseña" });
        return;
    }

    try {
        const session = await authenticate(input.data.email, input.data.password);
        if (!session.accessToken) throw new ApiError(401, "Incorrect email or password");

        res.cookie(SESSION_COOKIE, session.accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: env.NODE_ENV === "production",
            maxAge: (session.expiresIn ?? 3600) * 1000,
        });
        res.redirect("/");
    } catch (err) {
        if (!(err instanceof ApiError) || err.status >= 500) throw err;
        res.status(err.status).render("login", { title: "Iniciar sesión", error: "Correo o contraseña incorrectos" });
    }
}

export function logout(_req: Request, res: Response) {
    res.clearCookie(SESSION_COOKIE);
    res.redirect("/login");
}

export async function home(_req: Request, res: Response) {
    const user = currentUser(res);
    const own = !isAdmin(user);
    const recordingScope = own ? { userId: user.id } : undefined;
    const childScope = own ? { recording: { userId: user.id } } : undefined;

    const [users, recordings, transcriptions, summaries, latest] = await Promise.all([
        own ? 0 : prisma.user.count(),
        prisma.recording.count({ where: recordingScope }),
        prisma.transcription.count({ where: childScope }),
        prisma.summary.count({ where: childScope }),
        prisma.recording.findMany({
            where: recordingScope,
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { user: true },
        }),
    ]);

    res.render("home", {
        title: "Inicio",
        counts: { users, recordings, transcriptions, summaries },
        latest,
    });
}

export async function recordingList(_req: Request, res: Response) {
    const { status, userId } = res.locals.query as { status?: RecordingStatus; userId?: string };
    const user = currentUser(res);
    if (userId) assertCanAccess(user, userId);

    const recordings = await prisma.recording.findMany({
        where: { status, userId: isAdmin(user) ? userId : user.id },
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
    assertCanAccess(currentUser(res), recording.userId);

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
