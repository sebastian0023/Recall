import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { pinoHttp } from "pino-http";
import { logger, maskUrl } from "../lib/logger.js";

const REQUEST_ID_HEADER = "X-Request-Id";
// Solo se acepta un id que venga del cliente si es corto y sin caracteres raros (evita ensuciar el log)
const SAFE_REQUEST_ID = /^[\w.:-]{1,128}$/;

function requestId(req: IncomingMessage, res: ServerResponse): string {
    const incoming = req.headers["x-request-id"];
    const id = typeof incoming === "string" && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
}

function requestLine(req: IncomingMessage, res: ServerResponse, responseTime?: number): string {
    const url = maskUrl((req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? "");
    const duration = responseTime === undefined ? "" : ` ${Math.round(responseTime)}ms`;
    return `${req.method} ${url} ${res.statusCode}${duration}`;
}

// Una línea por petición: método, ruta, status y duración (responseTime, en ms), con el id de la petición.
// Cada línea que se escriba con req.log durante la petición lleva el mismo reqId
export const requestLogger = pinoHttp({
    logger,
    genReqId: requestId,
    // req.log solo agrega { reqId } a cada línea; el método y la ruta van en la línea de la petición
    quietReqLogger: true,
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    customSuccessMessage: (req, res, responseTime) => requestLine(req, res, responseTime),
    // pino-http también pasa la duración como cuarto argumento
    customErrorMessage: (req, res, _err, responseTime?: number) => requestLine(req, res, responseTime),
    // En un 5xx, pino-http agrega un error genérico ("failed with status code 500"). Se quita porque
    // el errorHandler ya escribió el error real con su stack en otra línea con el mismo reqId
    customErrorObject: (_req, res, err, val: Record<string, unknown>) =>
        err.message === `failed with status code ${res.statusCode}` ? { ...val, err: undefined } : val,
    serializers: {
        req: (req: { method: string; url: string }) => ({ method: req.method, url: maskUrl(req.url) }),
        res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
});
