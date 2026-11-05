import type { RequestHandler } from "express";
import { ApiError } from "../lib/apiError.js";
import { assertCanAccess, currentUser } from "../lib/permissions.js";
import type { UserRole } from "../models/user.model.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
    return (req, _res, next) => {
        if (!roles.includes(currentUser(req).role)) throw new ApiError(403, "Forbidden");
        next();
    };
}

export const requireSelfOrAdmin: RequestHandler = (req, _res, next) => {
    assertCanAccess(currentUser(req), req.params.id as string);
    next();
};
