import type { Response } from "express";
import type { UserRole } from "../models/user.model.js";
import { ApiError } from "./apiError.js";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export function currentUser(res: Response): AuthUser {
    const user = res.locals.user as AuthUser | undefined;
    if (!user) throw new ApiError(401, "Unauthorized");
    return user;
}

export function isAdmin(user: AuthUser): boolean {
    return user.role === "ADMIN";
}

export function assertCanAccess(user: AuthUser, ownerId: string) {
    if (!isAdmin(user) && user.id !== ownerId) throw new ApiError(403, "Forbidden");
}
