
import type { Request, Response } from "express";
import { type ConfirmInput, toPublicUser, type LoginInput, type RegisterInput } from "../models/user.model.js";
import { ConfirmSignUpCommand, InitiateAuthCommand, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { env } from "../config/env.js";
import { cognito, secretHash } from "../lib/cognito.js";
import { prisma } from "../lib/prisma.js";


function sendCognitoError(res: Response, err: unknown) {
    const name = err instanceof Error ? err.name : "";
    console.error(`[cognito] ${name}: ${err instanceof Error ? err.message : err}`);
    const map: Record<string, [number, string]> = {
        UsernameExistsException: [409, "Email already registered"],
        InvalidPasswordException: [400, "Password does not meet requirements"],
        InvalidParameterException: [400, "Invalid parameters"],
        CodeMismatchException: [400, "Invalid confirmation code"],
        ExpiredCodeException: [400, "Confirmation code expired"],
        NotAuthorizedException: [401, "Incorrect email or password"],
        UserNotConfirmedException: [403, "User not confirmed"],
        UserNotFoundException: [401, "Incorrect email or password"],
    };
    const [status, message] = map[name] ?? [500, "Internal server error"];
    res.status(status).json({ error: { message } });
}

export async function register(req:Request, res:Response) {
    const {email, password, name} = req.body as RegisterInput;
    if (!email || !password || !name){
        res.status(400).json({ error: { message: "email, password and name are required" } });
        return;
    }

    try {
        const result = await cognito.send(
            new SignUpCommand({
                ClientId: env.COGNITO_CLIENT_ID,
                Username: email,
                Password: password,
                SecretHash: secretHash(email),
                UserAttributes: [
                    { Name: "email", Value: email },
                    { Name: "name", Value: name }
                ],
            }),
        );

        const user = await prisma.user.create({
            data: { cognitoSub: result.UserSub!, email, name },
        });

        res.status(201).json({
            data: toPublicUser(user),
            message: "user registered"
        });
    } catch(err) {
        sendCognitoError(res,err);
    }

}

export async function confirm(req: Request, res: Response) {
    const { email, code } = req.body as ConfirmInput;

    try {
        await cognito.send(
            new ConfirmSignUpCommand({
                ClientId: env.COGNITO_CLIENT_ID,
                Username: String(email),
                ConfirmationCode: String(code),
                SecretHash: secretHash(String(email)),
            }),
        );
        res.status(200).json({ message: "Email confirmed" });
    } catch (err) {
        sendCognitoError(res, err);
    }
}

export async function login(req: Request, res: Response) {
    const { email, password } = req.body as LoginInput;

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

        const tokens = result.AuthenticationResult;
        if (!tokens) {
            res.status(401).json({ error: { message: "Authentication challenge not supported" } });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        res.status(200).json({
            data: {
                accessToken: tokens.AccessToken,
                idToken: tokens.IdToken,
                refreshToken: tokens.RefreshToken,
                expiresIn: tokens.ExpiresIn,
                user: user ? toPublicUser(user) : null,
            },
            message: "Login successful",
        });
    } catch (err) {
        sendCognitoError(res, err);
    }
}

export async function me(_req: Request, res: Response) {
    const authUser = res.locals.user as { id: string };
    const user = await prisma.user.findUnique({ where: { id: authUser.id } });

    if (!user) {
        res.status(404).json({ error: { message: "User not found" } });
        return;
    }

    res.status(200).json({
        data: toPublicUser(user),
        message: "Authenticated user",
    });
}