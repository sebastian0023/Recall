export interface ErrorDetail {
    field: string;
    message: string;
}

// Error esperado de la API: el errorHandler lo responde tal cual con su status
export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
        public readonly details?: ErrorDetail[],
        // Código estable para que el cliente distinga el motivo sin leer el mensaje (p. ej. EMAIL_NOT_VERIFIED)
        public readonly code?: string,
    ) {
        super(message);
        this.name = "ApiError";
    }
}
