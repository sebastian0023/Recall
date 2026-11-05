import type { Request } from "express";
import type { UserRole } from "../models/user.model.js";
import { ApiError } from "./apiError.js";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

// requireAuth deja al usuario en req.user; sin él no hay sesión
export function currentUser(req: Request): AuthUser {
    if (!req.user) throw new ApiError(401, "Unauthorized");
    return req.user;
}

export function isAdmin(user: AuthUser): boolean {
    return user.role === "ADMIN";
}

export function assertCanAccess(user: AuthUser, ownerId: string) {
    if (!isAdmin(user) && user.id !== ownerId) throw new ApiError(403, "Forbidden");
}
