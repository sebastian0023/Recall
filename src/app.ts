import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "node:path";
import { docsRouter } from "./docs/swagger.js";
import { hbsEngine } from "./lib/handlebars.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import routes from "./routes/index.js";
import viewRoutes from "./routes/view.routes.js";

const app = express();

const root = path.join(import.meta.dirname, "..");

app.engine(".hbs", hbsEngine);
app.set("view engine", ".hbs");
app.set("views", path.join(root, "views"));

// Primero, para que cada petición (incluidos los errores y los 404) tenga su línea de log y su X-Request-Id
app.use(requestLogger);
app.use(cors({ exposedHeaders: ["X-Request-Id"] }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(root, "public")));

/**
 * @openapi
 * /health:
 *   servers:
 *     - url: /
 *       description: Raíz del servidor (esta ruta está fuera de /api/v1)
 *   get:
 *     tags: [Health]
 *     operationId: getHealth
 *     summary: Revisa que el servidor esté arriba
 *     description: Ruta pública. No consulta la base de datos; la usa el CI para saber cuándo arrancó el API.
 *     security: []
 *     responses:
 *       200:
 *         description: El servidor responde
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status]
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok]
 *             example:
 *               status: ok
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Documentación interactiva (Swagger UI) y especificación OpenAPI, públicas
app.use("/docs", docsRouter);

app.use("/api/v1", routes);
app.use(viewRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
