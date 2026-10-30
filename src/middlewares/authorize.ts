import type { RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";
import { assertCanAccess, currentUser } from "../lib/permissions.js";
import type { UserRole } from "../models/user.model.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
    return (_req, res, next) => {
        if (!roles.includes(currentUser(res).role)) throw new ApiError(403, "Forbidden");
        next();
    };
}

export const requireSelfOrAdmin: RequestHandler = (req, res, next) => {
    assertCanAccess(currentUser(res), req.params.id as string);
    next();
};
