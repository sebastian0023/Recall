// Esquemas compartidos de la especificación OpenAPI (components.schemas y components.responses).
// Se definen una sola vez y cada endpoint los usa con $ref, p. ej. { $ref: "#/components/schemas/User" }.
// Deben coincidir con lo que responde el API: si un campo no existe en la respuesta real, no va aquí.

const uuid = { type: "string", format: "uuid", example: "11111111-1111-4111-8111-000000000003" };
const timestamp = { type: "string", format: "date-time", example: "2026-11-09T18:30:00.000Z" };

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

// { data, message }: el formato de éxito de todos los endpoints de datos
const envelope = (data: object) => ({
    type: "object",
    required: ["data", "message"],
    properties: { data, message: { type: "string", description: "Texto corto que describe el resultado" } },
});

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
                    code: {
                        type: "string",
                        description: "Solo en algunos errores: código estable para distinguir el motivo (p. ej. EMAIL_NOT_VERIFIED)",
                        example: "EMAIL_NOT_VERIFIED",
                    },
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

    // Modelos con las relaciones que incluye cada respuesta (ver los controladores)
    UserWithCount: {
        description: "Usuario con el número de grabaciones (GET /users).",
        allOf: [
            { $ref: "#/components/schemas/User" },
            {
                type: "object",
                required: ["_count"],
                properties: { _count: { type: "object", required: ["recordings"], properties: { recordings: { type: "integer", example: 2 } } } },
            },
        ],
    },
    UserWithRecordings: {
        description: "Usuario con sus grabaciones, de la más reciente a la más antigua (GET /users/{id}).",
        allOf: [
            { $ref: "#/components/schemas/User" },
            {
                type: "object",
                required: ["recordings"],
                properties: { recordings: { type: "array", items: { $ref: "#/components/schemas/Recording" } } },
            },
        ],
    },
    RecordingRef: {
        type: "object",
        description: "Resumen de la grabación que acompaña a transcripciones y resúmenes en los listados.",
        required: ["id", "title", "status"],
        properties: {
            id: { ...uuid, example: "22222222-2222-4222-8222-000000000001" },
            title: { type: "string", example: "Clase de Bases de Datos: normalización" },
            status: { $ref: "#/components/schemas/RecordingStatus" },
        },
    },
    RecordingListItem: {
        description: "Grabación con su dueño y el número de resúmenes (GET /recordings).",
        allOf: [
            { $ref: "#/components/schemas/Recording" },
            {
                type: "object",
                required: ["user", "_count"],
                properties: {
                    user: { $ref: "#/components/schemas/User" },
                    _count: { type: "object", required: ["summaries"], properties: { summaries: { type: "integer", example: 2 } } },
                },
            },
        ],
    },
    RecordingDetail: {
        description: "Grabación con su dueño, su transcripción (si ya tiene) y sus resúmenes, del más antiguo al más reciente (GET /recordings/{id}).",
        allOf: [
            { $ref: "#/components/schemas/Recording" },
            {
                type: "object",
                required: ["user", "transcription", "summaries"],
                properties: {
                    user: { $ref: "#/components/schemas/User" },
                    // null cuando la grabación todavía no tiene transcripción. (nullable + allOf no admite null en OpenAPI 3.0: se usa anyOf)
                    transcription: { anyOf: [{ $ref: "#/components/schemas/Transcription" }, { type: "object", nullable: true, enum: [null] }] },
                    summaries: { type: "array", items: { $ref: "#/components/schemas/Summary" } },
                },
            },
        ],
    },
    TranscriptionListItem: {
        description: "Transcripción con un resumen de su grabación (GET /transcriptions).",
        allOf: [
            { $ref: "#/components/schemas/Transcription" },
            { type: "object", required: ["recording"], properties: { recording: { $ref: "#/components/schemas/RecordingRef" } } },
        ],
    },
    TranscriptionDetail: {
        description: "Transcripción con su grabación completa (GET /transcriptions/{id}).",
        allOf: [
            { $ref: "#/components/schemas/Transcription" },
            { type: "object", required: ["recording"], properties: { recording: { $ref: "#/components/schemas/Recording" } } },
        ],
    },
    SummaryListItem: {
        description: "Resumen con un resumen de su grabación (GET /summaries).",
        allOf: [
            { $ref: "#/components/schemas/Summary" },
            { type: "object", required: ["recording"], properties: { recording: { $ref: "#/components/schemas/RecordingRef" } } },
        ],
    },
    SummaryDetail: {
        description: "Resumen con su grabación completa (GET /summaries/{id}).",
        allOf: [
            { $ref: "#/components/schemas/Summary" },
            { type: "object", required: ["recording"], properties: { recording: { $ref: "#/components/schemas/Recording" } } },
        ],
    },

    // Bodies de entrada (las restricciones salen de los esquemas zod de src/schemas/)
    UpdateUserInput: {
        type: "object",
        description: "Al menos un campo. Solo un administrador puede enviar role.",
        minProperties: 1,
        additionalProperties: false,
        properties: {
            name: { type: "string", minLength: 1, maxLength: 100, example: "Ana López Ruiz" },
            email: { type: "string", format: "email", maxLength: 254, example: "ana.nueva@recall.app" },
            role: { $ref: "#/components/schemas/UserRole" },
        },
    },
    CreateRecordingInput: {
        type: "object",
        required: ["title", "s3Key"],
        additionalProperties: false,
        properties: {
            userId: { ...uuid, description: "Dueño de la grabación. Si no se envía, es quien hace la petición. Solo un administrador puede poner el de otro usuario." },
            title: { type: "string", minLength: 1, maxLength: 200, example: "Reunión con el cliente" },
            s3Key: { type: "string", minLength: 1, maxLength: 500, example: "audio/seed/reunion-cliente.mp3" },
            durationSec: { type: "integer", minimum: 0, nullable: true, example: 1800 },
        },
    },
    UpdateRecordingInput: {
        type: "object",
        description: "Al menos un campo.",
        minProperties: 1,
        additionalProperties: false,
        properties: {
            title: { type: "string", minLength: 1, maxLength: 200, example: "Reunión con el cliente (v2)" },
            s3Key: { type: "string", minLength: 1, maxLength: 500, example: "audio/seed/reunion-cliente.mp3" },
            durationSec: { type: "integer", minimum: 0, nullable: true, example: 1900 },
            status: { $ref: "#/components/schemas/RecordingStatus" },
            errorMessage: { type: "string", maxLength: 1000, nullable: true, example: null },
        },
    },
    CreateTranscriptionInput: {
        type: "object",
        required: ["recordingId", "fullText"],
        additionalProperties: false,
        properties: {
            recordingId: { ...uuid, example: "22222222-2222-4222-8222-000000000007" },
            language: { type: "string", pattern: "^[a-z]{2}(-[A-Z]{2})?$", default: "es-US", example: "es-MX" },
            fullText: { type: "string", minLength: 1, example: "Hoy vamos a ver integrales por partes." },
            segments: { type: "array", items: { $ref: "#/components/schemas/TranscriptionSegment" } },
        },
    },
    UpdateTranscriptionInput: {
        type: "object",
        description: "Al menos un campo.",
        minProperties: 1,
        additionalProperties: false,
        properties: {
            language: { type: "string", pattern: "^[a-z]{2}(-[A-Z]{2})?$", example: "es-MX" },
            fullText: { type: "string", minLength: 1, example: "Texto corregido de la transcripción." },
            segments: { type: "array", items: { $ref: "#/components/schemas/TranscriptionSegment" } },
        },
    },
    CreateSummaryInput: {
        type: "object",
        required: ["recordingId", "template", "content"],
        additionalProperties: false,
        properties: {
            recordingId: { ...uuid, example: "22222222-2222-4222-8222-000000000005" },
            template: { $ref: "#/components/schemas/SummaryTemplate" },
            content: { type: "string", minLength: 1, maxLength: 20000, example: "Acuerdos con el asesor: justificar la muestra y entregar el marco teórico." },
        },
    },
    UpdateSummaryInput: {
        type: "object",
        description: "Al menos un campo.",
        minProperties: 1,
        additionalProperties: false,
        properties: {
            template: { $ref: "#/components/schemas/SummaryTemplate" },
            content: { type: "string", minLength: 1, maxLength: 20000, example: "Contenido corregido del resumen." },
        },
    },

    // Envolturas { data, message } que usan todos los endpoints de datos
    ...Object.fromEntries(
        Object.entries({
            UserEnvelope: ref("User"),
            UserListEnvelope: { type: "array", items: ref("UserWithCount") },
            UserDetailEnvelope: ref("UserWithRecordings"),
            RecordingEnvelope: ref("Recording"),
            RecordingListEnvelope: { type: "array", items: ref("RecordingListItem") },
            RecordingDetailEnvelope: ref("RecordingDetail"),
            RecordingSummariesEnvelope: { type: "array", items: ref("Summary") },
            RecordingTranscriptionEnvelope: ref("Transcription"),
            TranscriptionEnvelope: ref("Transcription"),
            TranscriptionListEnvelope: { type: "array", items: ref("TranscriptionListItem") },
            TranscriptionDetailEnvelope: ref("TranscriptionDetail"),
            SummaryEnvelope: ref("Summary"),
            SummaryListEnvelope: { type: "array", items: ref("SummaryListItem") },
            SummaryDetailEnvelope: ref("SummaryDetail"),
        }).map(([name, data]) => [name, envelope(data as object)]),
    ),
};

const queryParam = (name: string, description: string, schema: object) => ({ name, in: "query", required: false, description, schema });

// Parámetros reutilizables: { $ref: "#/components/parameters/IdPath" }
export const parameters = {
    IdPath: {
        name: "id",
        in: "path",
        required: true,
        description: "Id (UUID) del recurso. Con un formato inválido responde 400.",
        schema: { type: "string", format: "uuid", example: "22222222-2222-4222-8222-000000000001" },
    },
    RecordingStatusQuery: queryParam("status", "Filtra por estado", ref("RecordingStatus")),
    RecordingOwnerQuery: queryParam("userId", "Filtra por dueño. Un usuario solo puede pedir el suyo (si no, 403)", { type: "string", format: "uuid" }),
    RecordingIdQuery: queryParam("recordingId", "Filtra por grabación", { type: "string", format: "uuid" }),
    SummaryTemplateQuery: queryParam("template", "Filtra por plantilla", ref("SummaryTemplate")),
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
    NoContent: { description: "Hecho; la respuesta no tiene body" },
    RecordingForbidden: {
        description: "Hay sesión, pero no tiene permiso: la grabación es de otro usuario o el correo no está verificado",
        content: {
            "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                    forbidden: {
                        summary: "La grabación es de otro usuario",
                        value: { error: { message: "Forbidden", requestId: "3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3" } },
                    },
                    emailNotVerified: {
                        summary: "El correo no está verificado",
                        value: {
                            error: {
                                message: "Verifica tu correo para realizar esta acción",
                                code: "EMAIL_NOT_VERIFIED",
                                requestId: "3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3",
                            },
                        },
                    },
                },
            },
        },
    },
    NotFound: errorResponse("El recurso no existe", "Resource not found"),
    Conflict: errorResponse("Conflicto con el estado actual (duplicado o recursos relacionados)", "Resource already exists"),
};
