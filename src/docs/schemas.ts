// Esquemas compartidos de la especificación OpenAPI (components.schemas y components.responses).
// Se definen una sola vez y cada endpoint los usa con $ref, p. ej. { $ref: "#/components/schemas/User" }.
// Deben coincidir con lo que responde el API: si un campo no existe en la respuesta real, no va aquí.

const uuid = { type: "string", format: "uuid", example: "11111111-1111-4111-8111-000000000003" };
const timestamp = { type: "string", format: "date-time", example: "2026-11-09T18:30:00.000Z" };

export const schemas = {
    ErrorDetail: {
        type: "object",
        required: ["field", "message"],
        properties: {
            field: { type: "string", description: "Campo con el error (ruta con puntos, o body si es del objeto)", example: "email" },
            message: { type: "string", example: "Must be a valid email" },
        },
    },
    Error: {
        type: "object",
        description: "Formato de todas las respuestas de error. Nunca incluye stack ni códigos de la BD.",
        required: ["error"],
        properties: {
            error: {
                type: "object",
                required: ["message", "requestId"],
                properties: {
                    message: { type: "string", example: "Resource not found" },
                    details: {
                        type: "array",
                        description: "Solo en errores de validación (400): un elemento por campo",
                        items: { $ref: "#/components/schemas/ErrorDetail" },
                    },
                    requestId: {
                        type: "string",
                        description: "Mismo valor que el encabezado X-Request-Id y que el reqId del log de esa petición",
                        example: "3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3",
                    },
                },
            },
        },
    },

    UserRole: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
    RecordingStatus: { type: "string", enum: ["UPLOADED", "PROCESSING", "DONE", "FAILED"], example: "DONE" },
    SummaryTemplate: { type: "string", enum: ["MEETING", "CLASS", "INTERVIEW"], example: "MEETING" },

    User: {
        type: "object",
        description: "Usuario público: nunca incluye la contraseña ni su hash.",
        required: ["id", "email", "name", "role", "emailVerified", "createdAt", "updatedAt"],
        properties: {
            id: uuid,
            email: { type: "string", format: "email", maxLength: 254, example: "ana.lopez@recall.app" },
            name: { type: "string", minLength: 1, maxLength: 100, example: "Ana López" },
            role: { $ref: "#/components/schemas/UserRole" },
            emailVerified: { type: "boolean", description: "true cuando el usuario confirmó su correo (o entró con Google)", example: true },
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    },
    Session: {
        type: "object",
        description: "Sesión creada por el login: el accessToken va en Authorization: Bearer <token>.",
        required: ["accessToken", "tokenType", "expiresIn", "user"],
        properties: {
            accessToken: { type: "string", description: "JWT firmado con HS256", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…" },
            tokenType: { type: "string", enum: ["Bearer"], example: "Bearer" },
            expiresIn: { type: "integer", description: "Segundos de vida del token (JWT_EXPIRES_IN)", example: 3600 },
            user: { $ref: "#/components/schemas/User" },
        },
    },

    Recording: {
        type: "object",
        required: ["id", "userId", "title", "s3Key", "durationSec", "status", "transcribeJobId", "errorMessage", "createdAt", "updatedAt"],
        properties: {
            id: { ...uuid, example: "22222222-2222-4222-8222-000000000001" },
            userId: uuid,
            title: { type: "string", minLength: 1, maxLength: 200, example: "Clase de Bases de Datos: normalización" },
            s3Key: { type: "string", minLength: 1, maxLength: 500, example: "audio/seed/bd-normalizacion.mp3" },
            durationSec: { type: "integer", minimum: 0, nullable: true, example: 3120 },
            status: { $ref: "#/components/schemas/RecordingStatus" },
            transcribeJobId: { type: "string", nullable: true, example: "job-seed-1" },
            errorMessage: { type: "string", maxLength: 1000, nullable: true, example: null },
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    },
    TranscriptionSegment: {
        type: "object",
        required: ["speaker", "startMs", "endMs", "text"],
        properties: {
            speaker: { type: "string", minLength: 1, example: "Profesor" },
            startMs: { type: "integer", minimum: 0, example: 0 },
            endMs: { type: "integer", minimum: 0, description: "Mayor o igual que startMs", example: 9200 },
            text: { type: "string", example: "Hoy vamos a ver normalización." },
        },
    },
    Transcription: {
        type: "object",
        required: ["id", "recordingId", "language", "fullText", "segments", "createdAt", "updatedAt"],
        properties: {
            id: { ...uuid, example: "33333333-3333-4333-8333-000000000001" },
            recordingId: { ...uuid, example: "22222222-2222-4222-8222-000000000001" },
            language: { type: "string", pattern: "^[a-z]{2}(-[A-Z]{2})?$", example: "es-MX" },
            fullText: { type: "string", minLength: 1, example: "Hoy vamos a ver normalización…" },
            segments: { type: "array", nullable: true, items: { $ref: "#/components/schemas/TranscriptionSegment" } },
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    },
    Summary: {
        type: "object",
        required: ["id", "recordingId", "template", "content", "createdAt", "updatedAt"],
        properties: {
            id: { ...uuid, example: "44444444-4444-4444-8444-000000000001" },
            recordingId: { ...uuid, example: "22222222-2222-4222-8222-000000000001" },
            template: { $ref: "#/components/schemas/SummaryTemplate" },
            content: { type: "string", minLength: 1, maxLength: 20000, example: "Puntos clave: 1FN, 2FN y 3FN…" },
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    },
};

const errorResponse = (description: string, message: string, extra: Record<string, unknown> = {}) => ({
    description,
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
            example: { error: { message, ...extra, requestId: "3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3" } },
        },
    },
});

// Respuestas de error reutilizables: { $ref: "#/components/responses/Unauthorized" }
export const responses = {
    BadRequest: errorResponse("Datos inválidos (body, params o query), con el detalle de cada campo", "Invalid data", {
        details: [{ field: "email", message: "Must be a valid email" }],
    }),
    Unauthorized: errorResponse("Falta el token, o es inválido, alterado o expiró", "Unauthorized"),
    Forbidden: errorResponse("Hay sesión, pero el usuario no tiene permiso para esta acción", "Forbidden"),
    NotFound: errorResponse("El recurso no existe", "Resource not found"),
    Conflict: errorResponse("Conflicto con el estado actual (duplicado o recursos relacionados)", "Resource already exists"),
};
