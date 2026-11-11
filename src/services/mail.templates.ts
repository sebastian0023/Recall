import { env } from "../config/env.js";
import { TEMPLATE_LABELS } from "../lib/labels.js";

export interface EmailContent {
    subject: string;
    heading: string;
    paragraphs: string[];
    quote?: string; // fragmento citado (p. ej. el extracto de un resumen)
    action?: { label: string; url: string };
    footnote?: string;
}

export interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}

const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// "24 horas", "1 hora", "30 minutos": para decir cuándo vence un enlace
export function humanDuration(seconds: number): string {
    const units: [string, string, number][] = [
        ["día", "días", 86400],
        ["hora", "horas", 3600],
        ["minuto", "minutos", 60],
    ];
    for (const [singular, plural, size] of units) {
        if (seconds >= size && seconds % size === 0) {
            const n = seconds / size;
            return `${n} ${n === 1 ? singular : plural}`;
        }
    }
    return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
}

// Extracto de un texto largo: junta los espacios y saltos de línea y corta en la última palabra completa
export function excerpt(content: string, max = 300): string {
    const text = content.replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1))}…`;
}

// Layout común: todos los correos salen de aquí, con versión HTML (estilos en línea) y versión de texto
export function renderEmail({ subject, heading, paragraphs, quote, action, footnote }: EmailContent): RenderedEmail {
    const note = footnote ?? "Si no fuiste tú, puedes ignorar este correo.";

    const html = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2933;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;">
      <tr><td style="padding:24px 32px;border-bottom:1px solid #e4e7eb;font-size:20px;font-weight:bold;">Recall</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>
        ${paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(p)}</p>`).join("\n        ")}
        ${quote ? `<blockquote style="margin:0 0 16px;padding:8px 16px;border-left:4px solid #2563eb;background:#f4f5f7;line-height:1.5;color:#323f4b;">${escapeHtml(quote)}</blockquote>` : ""}
        ${
            action
                ? `<p style="margin:24px 0;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">${escapeHtml(action.label)}</a></p>
        <p style="margin:0 0 16px;font-size:13px;color:#52606d;word-break:break-all;">Si el botón no funciona, copia este enlace en tu navegador:<br>${escapeHtml(action.url)}</p>`
                : ""
        }
        <p style="margin:24px 0 0;font-size:13px;color:#52606d;">${escapeHtml(note)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

    const text = [
        `Recall`,
        "",
        heading,
        "",
        ...paragraphs.flatMap((p) => [p, ""]),
        ...(quote ? [...quote.split("\n").map((line) => `> ${line}`), ""] : []),
        ...(action ? [`${action.label}: ${action.url}`, ""] : []),
        note,
    ].join("\n");

    return { subject, html, text };
}

export const verificationEmail = (name: string, link: string): EmailContent => ({
    subject: "Recall: verifica tu correo",
    heading: `Hola, ${name}`,
    paragraphs: [
        "Gracias por crear tu cuenta en Recall. Confirma tu correo para poder subir y procesar tus grabaciones.",
        `El enlace es de un solo uso y vence en ${humanDuration(env.VERIFY_TOKEN_TTL)}.`,
    ],
    action: { label: "Verificar mi correo", url: link },
});

export const passwordResetEmail = (name: string, link: string): EmailContent => ({
    subject: "Recall: restablece tu contraseña",
    heading: `Hola, ${name}`,
    paragraphs: [
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Recall.",
        `El enlace es de un solo uso y vence en ${humanDuration(env.RESET_TOKEN_TTL)}.`,
    ],
    action: { label: "Crear una contraseña nueva", url: link },
    footnote: "Si no pediste este cambio, ignora este correo: tu contraseña no se modifica.",
});

export const summaryReadyEmail = (
    name: string,
    recording: { title: string },
    summary: { template: string; content: string },
    link: string,
): EmailContent => ({
    subject: `Recall: tu resumen de "${recording.title}" está listo`,
    heading: `Hola, ${name}`,
    paragraphs: [`Ya está listo un resumen de tu grabación "${recording.title}" (${TEMPLATE_LABELS[summary.template] ?? summary.template}). Así empieza:`],
    quote: excerpt(summary.content),
    action: { label: "Ver el resumen", url: link },
    footnote: "Recibes este correo porque la grabación es tuya.",
});
