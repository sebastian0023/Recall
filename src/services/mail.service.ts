import nodemailer from "nodemailer";
import type { Logger } from "pino";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { type EmailContent, passwordResetEmail, renderEmail, summaryReadyEmail, verificationEmail } from "./mail.templates.js";

export interface MailRecipient {
    id: string;
    email: string;
    name: string;
}

// El único lugar que crea el transporte. Los timeouts son cortos para que un SMTP caído no deje colgada la petición
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER && { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } }),
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
});

// Nunca lanza: si el correo no sale, la petición responde igual. Regresa true si se envió.
// El log lleva el tipo de correo y el usuario, jamás el enlace ni el token
async function send(kind: string, to: MailRecipient, content: EmailContent, log: Logger): Promise<boolean> {
    try {
        const { subject, html, text } = renderEmail(content);
        await transporter.sendMail({ from: env.MAIL_FROM, to: to.email, subject, html, text });
        log.info({ mail: kind, userId: to.id }, "Email sent");
        return true;
    } catch (err) {
        const reason = (err as { code?: string }).code ?? (err instanceof Error ? err.name : "unknown");
        log.warn({ mail: kind, userId: to.id, reason }, "Email not sent");
        return false;
    }
}

// log: el logger de la petición (req.log) para que la línea lleve su reqId
export const sendVerificationEmail = (user: MailRecipient, link: string, log: Logger = logger) =>
    send("verify-email", user, verificationEmail(user.name, link), log);

export const sendPasswordResetEmail = (user: MailRecipient, link: string, log: Logger = logger) =>
    send("reset-password", user, passwordResetEmail(user.name, link), log);

export const sendSummaryReadyEmail = (
    owner: MailRecipient,
    recording: { title: string },
    summary: { template: string; content: string },
    link: string,
    log: Logger = logger,
) => send("summary-ready", owner, summaryReadyEmail(owner.name, recording, summary, link), log);
