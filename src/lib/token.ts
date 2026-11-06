import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

// "3600" se interpreta como segundos; "15m", "1h", etc. ya traen su unidad
const expiresIn = (/^\d+$/.test(env.JWT_EXPIRES_IN) ? Number(env.JWT_EXPIRES_IN) : env.JWT_EXPIRES_IN) as SignOptions["expiresIn"];

// El rol no va en el token: se lee de la BD en cada petición, así un cambio de rol surte efecto de inmediato
export function signToken(userId: string): { token: string; expiresIn: number } {
    const token = jwt.sign({}, env.JWT_SECRET, { algorithm: "HS256", subject: userId, expiresIn });
    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
    return { token, expiresIn: exp - iat };
}

// Devuelve el id del usuario (sub) o lanza 401
export function verifyToken(token: string): string {
    try {
        const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
        if (typeof payload === "string" || !payload.sub) throw new ApiError(401, "Invalid token");
        return payload.sub;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if (err instanceof jwt.TokenExpiredError) throw new ApiError(401, "Token expired");
        throw new ApiError(401, "Invalid token");
    }
}
