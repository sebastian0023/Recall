import type { AuthUser } from "../lib/permissions.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
