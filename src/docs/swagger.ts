import path from "node:path";
import { Router } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { responses, schemas } from "./schemas.js";

// Carpeta raíz del código: src/ con npm run dev y dist/ después de npm run build.
// Por eso se buscan los comentarios @openapi en archivos .ts y .js (tsconfig conserva los comentarios)
const codeRoot = path.join(import.meta.dirname, "..");

const definition = {
    openapi: "3.0.3",
    info: {
        title: "Recall API",
        version: "1.0.0",
        license: { name: "ISC", url: "https://opensource.org/license/isc-license-txt" },
        description: [
            "REST API de Recall: grabaciones de reuniones, clases y entrevistas, con su transcripción y sus resúmenes.",
            "",
            "**Cómo probar las rutas protegidas:** haz login en `POST /auth/login`, copia `data.accessToken` y pégalo en **Authorize** (sin escribir `Bearer`).",
            "",
            "Todas las respuestas de error tienen el formato `{ error: { message, details?, requestId } }`; `requestId` coincide con el encabezado `X-Request-Id`.",
        ].join("\n"),
    },
    servers: [{ url: "/api/v1", description: "API v1 (mismo servidor que esta documentación)" }],
    tags: [
        { name: "Auth", description: "Registro, login y sesión" },
        { name: "Users", description: "Usuarios (perfil propio o administración)" },
        { name: "Recordings", description: "Grabaciones de audio y su procesamiento" },
        { name: "Transcriptions", description: "Transcripciones de las grabaciones" },
        { name: "Summaries", description: "Resúmenes generados a partir de las transcripciones" },
        { name: "Health", description: "Estado del servidor" },
    ],
    components: {
        // Se aplica solo en las rutas protegidas con security: [{ bearerAuth: [] }]; las públicas declaran security: []
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "accessToken que regresa POST /auth/login",
            },
        },
        schemas,
        responses,
    },
};

export const openapiSpec = swaggerJSDoc({
    definition,
    apis: [path.join(codeRoot, "routes/*.{ts,js}"), path.join(codeRoot, "app.{ts,js}")],
    failOnErrors: true, // un comentario @openapi con YAML inválido detiene el arranque en lugar de desaparecer en silencio
});

// GET /docs (Swagger UI) y GET /docs/openapi.json (la especificación). Ambas son públicas
export const docsRouter = Router();

docsRouter.get("/openapi.json", (_req, res) => {
    res.json(openapiSpec);
});
docsRouter.use(
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
        customSiteTitle: "Recall API · Docs",
        swaggerOptions: { persistAuthorization: true },
    }),
);
