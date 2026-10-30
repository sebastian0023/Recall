import { ConfirmSignUpCommand, InitiateAuthCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { cognito, secretHash } from "../lib/cognito.js";
import { prisma } from "../lib/prisma.js";
import { type ConfirmInput, type LoginInput, type RegisterInput, toPublicUser } from "../models/user.model.js";

// Errores de Cognito traducidos a ApiError; el errorHandler central arma la respuesta
const COGNITO_ERRORS: Record<string, [number, string]> = {
    UsernameExistsException: [409, "Email already registered"],
    InvalidPasswordException: [400, "Password does not meet requirements"],
    InvalidParameterException: [400, "Invalid parameters"],
    CodeMismatchException: [400, "Invalid confirmation code"],
    ExpiredCodeException: [400, "Confirmation code expired"],
    NotAuthorizedException: [401, "Incorrect email or password"],
    UserNotConfirmedException: [403, "User not confirmed"],
    UserNotFoundException: [401, "Incorrect email or password"],
};

function toApiError(err: unknown): unknown {
    const name = err instanceof Error ? err.name : "";
    const mapped = COGNITO_ERRORS[name];
    if (!mapped) return err; // desconocido: el errorHandler responde 500 y lo registra en consola
    console.error(`[cognito] ${name}: ${err instanceof Error ? err.message : err}`);
    return new ApiError(mapped[0], mapped[1]);
}

export async function register(req: Request, res: Response) {
    const { email, password, name } = req.body as RegisterInput;

    // Modo dummy: solo se guarda en la BD (email repetido -> P2002 -> 409 en el errorHandler)
    if (env.AUTH_MODE === "dummy") {
        const user = await prisma.user.create({
            data: { cognitoSub: `dummy-${randomUUID()}`, email, name },
        });
        res.status(201).json({ data: toPublicUser(user), message: "user registered" });
        return;
    }

    let sub: string;
    try {
        const result = await cognito.send(
            new SignUpCommand({
                ClientId: env.COGNITO_CLIENT_ID,
                Username: email,
                Password: password,
                SecretHash: secretHash(email),
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "name", Value: name },
                ],
            }),
        );
        sub = result.UserSub!;
    } catch (err) {
        throw toApiError(err);
    }

    const user = await prisma.user.create({
        data: { cognitoSub: sub, email, name },
    });

    res.status(201).json({
        data: toPublicUser(user),
        message: "user registered",
    });
}

export async function confirm(req: Request, res: Response) {
    const { email, code } = req.body as ConfirmInput;

    if (env.AUTH_MODE === "dummy") {
        res.status(200).json({ message: "Email confirmed" });
        return;
    }

    try {
        await cognito.send(
            new ConfirmSignUpCommand({
                ClientId: env.COGNITO_CLIENT_ID,
                Username: email,
                ConfirmationCode: code,
                SecretHash: secretHash(email),
            }),
        );
    } catch (err) {
        throw toApiError(err);
    }

    res.status(200).json({ message: "Email confirmed" });
}

export async function authenticate(email: string, password: string) {
    // Modo dummy: no hay contraseña que verificar, solo se busca al usuario
    if (env.AUTH_MODE === "dummy") {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new ApiError(401, "Incorrect email or password");

        return { accessToken: `dummy-${user.id}`, expiresIn: 3600, user: toPublicUser(user) };
    }

    let tokens;
    try {
        const result = await cognito.send(
            new InitiateAuthCommand({
                ClientId: env.COGNITO_CLIENT_ID,
                AuthFlow: "USER_PASSWORD_AUTH",
                AuthParameters: {
                    USERNAME: email,
                    PASSWORD: password,
                    ...(secretHash(email) && { SECRET_HASH: secretHash(email)! }),
                },
            }),
        );
        tokens = result.AuthenticationResult;
    } catch (err) {
        throw toApiError(err);
    }

    if (!tokens) throw new ApiError(401, "Authentication challenge not supported");

    const user = await prisma.user.findUnique({ where: { email } });

    return {
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken,
        refreshToken: tokens.RefreshToken,
        expiresIn: tokens.ExpiresIn,
        user: user ? toPublicUser(user) : null,
    };
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;
    const session = await authenticate(email, password);

    res.status(200).json({ data: session, message: "Login successful" });
}

export async function me(_req: Request, res: Response) {
    const authUser = res.locals.user as { id: string } | undefined;
    if (!authUser) throw new ApiError(401, "Unauthorized");

    const user = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({
        data: toPublicUser(user),
        message: "Authenticated user",
    });
}
