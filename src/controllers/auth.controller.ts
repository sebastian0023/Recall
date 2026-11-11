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
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/mail.service.js";

// Misma respuesta exista o no el correo, para no revelar qué correos están registrados
export const FORGOT_PASSWORD_MESSAGE = "Si el correo está registrado, recibirás un enlace";

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

// Si el correo existe, crea un token RESET_PASSWORD (invalida los anteriores) y manda el enlace. Si no existe, no hace nada
export async function requestPasswordReset(email: string, log: Logger = logger): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = await createToken(user.id, "RESET_PASSWORD");
    await sendPasswordResetEmail(user, appLink("/reset-password", { token }), log);
}

// Se llama sin esperar el resultado: así la respuesta tarda igual exista o no el correo.
// Los fallos quedan como warn (sin el correo del usuario, el enlace ni el token)
export function requestPasswordResetInBackground(email: string, log: Logger = logger): void {
    requestPasswordReset(email, log).catch((err: unknown) => {
        log.warn({ reason: err instanceof Error ? err.name : "unknown" }, "Password reset request failed");
    });
}

// Guarda la contraseña nueva y marca el token como usado en una sola transacción. Token inválido, usado o vencido -> 400.
// También sirve a quien solo entraba con Google (sin passwordHash): así crea su contraseña.
// Abrir el enlace prueba que el correo es suyo, por eso queda verificado
export async function resetPassword(token: string, password: string, log: Logger = logger): Promise<void> {
    const passwordHash = await hashPassword(password); // bcrypt es lento: se hace antes de abrir la transacción
    const userId = await prisma.$transaction(async (tx) => {
        const id = await consumeToken(token, "RESET_PASSWORD", tx);
        await tx.user.update({ where: { id }, data: { passwordHash, emailVerified: true } });
        return id;
    });
    log.info({ userId }, "Password reset");
}

export function forgotPassword(req: Request, res: Response) {
    requestPasswordResetInBackground((req.body as { email: string }).email, req.log);

    res.status(200).json({ data: null, message: FORGOT_PASSWORD_MESSAGE });
}

export async function resetPasswordHandler(req: Request, res: Response) {
    const { token, password } = req.body as { token: string; password: string };
    await resetPassword(token, password, req.log);

    res.status(200).json({ data: null, message: "Password updated" });
}
