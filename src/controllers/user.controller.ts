import type { Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";
import { prisma } from "../lib/prisma.js";
import { toPublicUser, type UpdateUserInput } from "../models/user.model.js";

export async function getUsers(_req: Request, res: Response) {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { recordings: true } } },
    });

    res.status(200).json({
        data: users.map(toPublicUser),
        message: "Users list",
    });
}

export async function getUserById(req: Request, res: Response) {
    const user = await prisma.user.findUnique({
        where: { id: req.params.id as string },
        include: { recordings: { orderBy: { createdAt: "desc" } } },
    });
    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json({
        data: toPublicUser(user),
        message: "User found",
    });
}

export async function updateUser(req: Request, res: Response) {
    const { name, email } = req.body as UpdateUserInput;

    // Email repetido -> P2002 -> 409; usuario inexistente -> P2025 -> 404 (errorHandler)
    const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: { name, email },
    });

    res.status(200).json({
        data: toPublicUser(user),
        message: "User updated",
    });
}

// Política de borrado: un usuario con grabaciones no se puede eliminar (409)
export async function deleteUser(req: Request, res: Response) {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
        where: { id },
        include: { _count: { select: { recordings: true } } },
    });
    if (!user) throw new ApiError(404, "User not found");
    if (user._count.recordings > 0) {
        throw new ApiError(409, "User has recordings; delete them first");
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
}
