import { engine } from "express-handlebars";
import { ROLE_LABELS, STATUS_LABELS, TEMPLATE_LABELS } from "./labels.js";


const dateFormat = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" });

export const hbsEngine = engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
        eq: (a: unknown, b: unknown) => a === b,
        statusLabel: (status: string) => STATUS_LABELS[status] ?? status,
        templateLabel: (template: string) => TEMPLATE_LABELS[template] ?? template,
        roleLabel: (role: string) => ROLE_LABELS[role] ?? role,
        lower: (value: string) => String(value).toLowerCase(),
        date: (value: Date | string) => dateFormat.format(new Date(value)),
        duration: (sec: number | null | undefined) => {
            if (sec === null || sec === undefined) return "—";
            const m = Math.floor(sec / 60);
            const s = String(sec % 60).padStart(2, "0");
            return `${m}:${s}`;
        },
        ms: (value: number) => {
            const total = Math.floor(value / 1000);
            return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
        },
    },
});
