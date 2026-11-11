import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../lib/apiError.js";
import { exchangeCodeForProfile, googleAuthUrl, newOAuthState } from "../lib/google.js";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/token.js";
import { setSessionCookie } from "../middlewares/auth.js";

const OAUTH_COOKIE = "recall_oauth";
const OAUTH_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

const fail = (res: Response, code: string) => res.redirect(`/login?error=${code}`);

// GET /auth/google: guarda state y nonce en una cookie de corta vida y manda al usuario a Google
export function googleStart(_req: Request, res: Response) {
    if (!env.GOOGLE_ENABLED) {
        fail(res, "google_disabled");
        return;
    }
    const { state, nonce } = newOAuthState();
    res.cookie(OAUTH_COOKIE, `${state}.${nonce}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: OAUTH_COOKIE_MAX_AGE_MS,
    });
    res.redirect(googleAuthUrl(state, nonce));
}

// Callback (la ruta sale de GOOGLE_CALLBACK_URL). Vincula por correo verificado o crea al usuario con rol USER
// y abre la misma sesión (JWT en cookie) que el login con contraseña
export async function googleCallback(req: Request, res: Response) {
    const saved = (req.cookies as Record<string, string | undefined>)[OAUTH_COOKIE];
    res.clearCookie(OAUTH_COOKIE);

    const { code, state, error } = req.query as Record<string, string | undefined>;
    if (error) {
        fail(res, "google_denied");
        return;
    }
    const [savedState, nonce] = saved?.split(".") ?? [];
    if (!code || !state || !savedState || !nonce || state !== savedState) {
        fail(res, "google_state");
        return;
    }

    try {
        const profile = await exchangeCodeForProfile(code, nonce);

        // Si ya hay un usuario con ese correo (registrado con contraseña o de una visita anterior) se reutiliza;
        // si no, se crea sin contraseña y con el rol por defecto (USER). El rol nunca viene de Google
        let user = await prisma.user.findFirst({ where: { email: { equals: profile.email, mode: "insensitive" } } });
        if (!user) {
            // Google ya exige email_verified (lib/google.ts), así que el correo nace verificado
            user = await prisma.user.create({ data: { email: profile.email, name: profile.name, emailVerified: true } });
            req.log.info({ userId: user.id }, "User registered with Google");
        } else if (!user.emailVerified) {
            user = await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        }

        const { token, expiresIn } = signToken(user.id);
        setSessionCookie(res, token, expiresIn);
        res.redirect("/");
    } catch (err) {
        if (!(err instanceof ApiError)) throw err;
        req.log.warn({ reason: err.message }, "Google login failed");
        fail(res, err.status === 403 ? "google_unverified" : "google_failed");
    }
}
