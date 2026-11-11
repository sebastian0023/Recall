// Textos en español de los enums: los usan las vistas (handlebars) y los correos
export const STATUS_LABELS: Record<string, string> = {
    UPLOADED: "Subida",
    PROCESSING: "Procesando",
    DONE: "Lista",
    FAILED: "Falló",
};

export const TEMPLATE_LABELS: Record<string, string> = {
    MEETING: "Reunión",
    CLASS: "Clase",
    INTERVIEW: "Entrevista",
};

export const ROLE_LABELS: Record<string, string> = {
    USER: "Usuario",
    ADMIN: "Administrador",
};
