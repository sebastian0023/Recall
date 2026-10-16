import type { Request, Response } from "express";
import { dummyUsers, toPublicUser, type UpdateUserInput } from "../models/user.model.js";

export function getUsers(_req: Request, res: Response) {
    res.status(200).json({
    data: dummyUsers.map(toPublicUser),
    message: "Users list",
    });
}

export function getUserById(req: Request, res: Response) {
    const id = req.params.id as string;
    const user = dummyUsers.find((u) => u.id === id) ?? { ...dummyUsers[0]!, id };

    res.status(200).json({
    data: toPublicUser(user),
    message: "User found",
    });
}

export function updateUser(req: Request, res: Response) {
    const id = req.params.id as string;
    const changes = req.body as UpdateUserInput;
    const user = dummyUsers.find((u) => u.id === id) ?? { ...dummyUsers[0]!, id };

    res.status(200).json({
    data: toPublicUser({ ...user, ...changes, updatedAt: new Date() }),
    message: "User updated",
    });
}

export function deleteUser(_req: Request, res: Response) {
    res.status(204).send();
}