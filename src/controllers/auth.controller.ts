import type { Request, Response } from "express";
import type { Logger } from "pino";
import { ApiError } from "../lib/apiError.js";
import { logger } from "../lib/logger.js";
import { appLink } from "../lib/appLink.js";
import { createToken, consumeToken } from "../lib/oneTimeToken.js";
import { currentUser } from "../lib/permissions.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/token.js";
import { type LoginInput, type RegisterInput, toPublicUser } from "../models/user.model.js";
import { sendVerificationEmail } from "../services/mail.service.js";

// Crea un token VERIFY_EMAIL (invalida el anterior) y manda el correo. Nunca lanza: si algo falla (correo o BD)
// queda un warn y quien llama sigue su camino. Regresa true si el correo salió. El enlace no se escribe en el log
export async function sendVerification(user: { id: string; email: string; name: string }, log: Logger = logger): Promise<boolean> {
    try {
        const token = await createToken(user.id, "VERIFY_EMAIL");
        return await sendVerificationEmail(user, appLink("/verify-email", { token }), log);
    } catch (err) {
        log.warn({ userId: user.id, reason: err instanceof Error ? err.name : "unknown" }, "Verification email not sent");
        return false;
    }
}

// Lo usan el endpoint del API y la vista del enlace del correo. Token inválido, vencido o usado -> 400
export async function verifyEmail(token: string, log: Logger = logger) {
    const user = await prisma.$transaction(async (tx) => {
        const userId = await consumeToken(token, "VERIFY_EMAIL", tx);
        return tx.user.update({ where: { id: userId }, data: { emailVerified: true } });
    });
    log.info({ userId: user.id }, "Email verified");
    return user;
}

// Si el correo ya está verificado no se manda nada ("already"); si no, se manda un enlace nuevo y el anterior deja de servir
export async function resendVerification(userId: string, log: Logger = logger): Promise<"already" | "sent"> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "User not found");
    if (user.emailVerified) return "already";

    await sendVerification(user, log);
    return "sent";
}

// log: el logger de la petición (req.log) para que la línea lleve su reqId
export async function createUser({ email, password, name }: RegisterInput, log: Logger = logger) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ApiError(409, "Email already registered");

    // El rol nunca viene del body: el registro siempre crea un USER (default del esquema).
    // Si dos registros del mismo correo coinciden, el índice único responde P2002 -> 409 en el errorHandler
    const user = await prisma.user.create({
        data: { email, name, passwordHash: await hashPassword(password) },
    });
    log.info({ userId: user.id }, "User registered");

    // Si el correo no sale, el usuario queda creado igual (sendVerification no lanza)
    await sendVerification(user, log);
    return user;
}

export async function register(req: Request, res: Response) {
    const user = await createUser(req.body as RegisterInput, req.log);

    res.status(201).json({
        data: toPublicUser(user),
        message: "user registered",
    });
}

// También lo usa el login de las vistas. Todos los fallos responden el mismo 401 genérico
export async function authenticate(email: string, password: string, log: Logger = logger) {
    const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });

    // Se compara siempre (contra un hash de relleno si no hay usuario o contraseña) para no revelar qué correos existen
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !valid) {
        log.warn({ email }, "Login failed");
        throw new ApiError(401, "Incorrect email or password");
    }

    const { token, expiresIn } = signToken(user.id);
    return { accessToken: token, tokenType: "Bearer", expiresIn, user: toPublicUser(user) };
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const session = await authenticate(email, password, req.log);

    res.status(200).json({ data: session, message: "Login successful" });
}

export async function me(req: Request, res: Response) {
    const user = await prisma.user.findUnique({ where: { id: currentUser(req).id } });
    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({
        data: toPublicUser(user),
        message: "Authenticated user",
    });
}

export async function verifyEmailHandler(req: Request, res: Response) {
    const user = await verifyEmail((req.body as { token: string }).token, req.log);

    res.status(200).json({ data: toPublicUser(user), message: "Email verified" });
}

export async function resendVerificationHandler(req: Request, res: Response) {
    const result = await resendVerification(currentUser(req).id, req.log);

    res.status(200).json({
        data: null,
        message: result === "already" ? "Email already verified" : "Verification email sent",
    });
}
