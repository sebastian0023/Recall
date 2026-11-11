import { env } from "../config/env.js";

// Arma un enlace absoluto con APP_URL: appLink("/verify-email", { token }) -> http://localhost:3000/verify-email?token=...
// Es el único lugar que conoce el dominio; los parámetros se codifican solos
export function appLink(path: string, params: Record<string, string> = {}): string {
    const url = new URL(path, `${env.APP_URL}/`);
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    return url.toString();
}
