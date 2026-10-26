import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError.js";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
    next(new ApiError(404, "Route not found"));
}
