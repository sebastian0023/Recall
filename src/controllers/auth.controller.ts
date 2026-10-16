
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { dummyUsers, toPublicUser, type LoginInput, type RegisterInput, type User } from "../models/user.model.js";

export function register(req:Request, res:Response) {
    const {email, name} = req.body as RegisterInput;
    const now_date = new Date();

    const user: User = {
        id: randomUUID(),
        email,
        name,
        passwordHash: "hash-dummy3",
        createdAt: now_date,
        updatedAt: now_date
    };

    res.status(201).json({
        data: toPublicUser(user),
        message: "User registered"
    });

}

export function login(req: Request, res: Response) {
    const { email } = req.body as LoginInput;
    const user = dummyUsers.find((u) => u.email === email) ?? dummyUsers[0]!;

    res.status(200).json({
    data: {
        token: "jwt-token",
        user: toPublicUser(user)
    },
    message: "Login successful"
    });
}

export function me(req: Request, res: Response) {
    const authUser = res.locals.user as { id: string } | undefined;
    const user = dummyUsers.find((u) => u.id === authUser?.id) ?? dummyUsers[0]!;

    res.status(200).json({
    data: toPublicUser(user),
    message: "Authenticated user"
    });
}
