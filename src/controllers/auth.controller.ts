import type { Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { currentUser } from "../lib/permissions.js";
import { DUMMY_HASH, hashPassword, verifyPassword } from "../lib/password.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/token.js";
import { type LoginInput, type RegisterInput, toPublicUser } from "../models/user.model.js";

export async function createUser({ email, password, name }: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ApiError(409, "Email already registered");

    // El rol nunca viene del body: el registro siempre crea un USER (default del esquema).
    // Si dos registros del mismo correo coinciden, el índice único responde P2002 -> 409 en el errorHandler
    return prisma.user.create({
        data: { email, name, passwordHash: await hashPassword(password) },
    });
}

export async function register(req: Request, res: Response) {
    const user = await createUser(req.body as RegisterInput);

    res.status(201).json({
        data: toPublicUser(user),
        message: "user registered",
    });
}

// También lo usa el login de las vistas. Todos los fallos responden el mismo 401 genérico
export async function authenticate(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email }, omit: { passwordHash: false } });

    // Se compara siempre (contra un hash de relleno si no hay usuario o contraseña) para no revelar qué correos existen
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !valid) throw new ApiError(401, "Incorrect email or password");

    const { token, expiresIn } = signToken(user.id);
    return { accessToken: token, tokenType: "Bearer", expiresIn, user: toPublicUser(user) };
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const session = await authenticate(email, password);

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
