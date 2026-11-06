import { randomBytes } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "./apiError.js";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleProfile {
    email: string;
    name: string;
}

// Ruta del callback en este servidor: sale de GOOGLE_CALLBACK_URL (.env), no está escrita en el código
export function googleCallbackPath(): string {
    return new URL(env.GOOGLE_CALLBACK_URL).pathname;
}

export function newOAuthState() {
    return { state: randomBytes(24).toString("hex"), nonce: randomBytes(24).toString("hex") };
}

export function googleAuthUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce,
        prompt: "select_account",
    });
    return `${AUTH_URL}?${params}`;
}

// Valida las claims del id_token. Llega directo del endpoint de token de Google por TLS, así que
// no se verifica la firma, pero sí emisor, audiencia, vigencia, nonce y que el correo esté verificado
export function profileFromIdToken(idToken: string, nonce: string, now = Date.now()): GoogleProfile {
    let claims: Record<string, unknown>;
    try {
        claims = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as Record<string, unknown>;
    } catch {
        throw new ApiError(401, "Invalid Google token");
    }

    const exp = typeof claims.exp === "number" ? claims.exp : 0;
    if (!ISSUERS.includes(String(claims.iss)) || claims.aud !== env.GOOGLE_CLIENT_ID || exp * 1000 <= now || claims.nonce !== nonce) {
        throw new ApiError(401, "Invalid Google token");
    }
    // Solo se vincula por correo si Google lo tiene verificado (si no, alguien podría tomar una cuenta ajena)
    if (typeof claims.email !== "string" || !claims.email || claims.email_verified !== true) {
        throw new ApiError(403, "Google email is not verified");
    }

    const name = typeof claims.name === "string" && claims.name.trim() ? claims.name.trim() : claims.email.split("@")[0]!;
    return { email: claims.email.toLowerCase(), name: name.slice(0, 100) };
}

export async function exchangeCodeForProfile(code: string, nonce: string): Promise<GoogleProfile> {
    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: env.GOOGLE_CALLBACK_URL,
            grant_type: "authorization_code",
        }),
    });
    if (!response.ok) throw new ApiError(401, "Google rejected the login");

    const { id_token } = (await response.json()) as { id_token?: string };
    if (!id_token) throw new ApiError(401, "Google rejected the login");
    return profileFromIdToken(id_token, nonce);
}
