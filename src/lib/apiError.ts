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
    ) {
        super(message);
        this.name = "ApiError";
    }
}
