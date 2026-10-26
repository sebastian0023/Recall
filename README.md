# Recall API

**Recall** es el REST API de una plataforma web que recibe audio de reuniones, clases y entrevistas, lo transcribe (Amazon Transcribe) y genera resúmenes con IA (Amazon Bedrock), sin depender de un dispositivo dedicado.

## Alcance de la Entrega 2

- Persistencia real con PostgreSQL + Prisma: CRUD de users, recordings, transcriptions y summaries.
- Conexión a la BD al arrancar (si falla, mensaje claro y el proceso termina).
- Códigos HTTP correctos (200/201/204/400/404/409) y errores traducidos en un middleware central.
- Validación de body, params y query con zod antes de llegar al controlador, con el error indicando qué campo falló.
- Pendiente en esta rama de trabajo: seed, colección de peticiones y vistas.

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript (`strict`) |
| Validación | zod |
| Runtime | Node.js 24 LTS |
| Framework | Express 5 |
| Base de datos | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 |
| Gestor de paquetes | npm |

## Requisitos

- Node.js 24
- Docker (con Docker Compose)

## Cómo correrlo

```bash
npm ci
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run build && npm start
```

1. `npm ci` instala las dependencias y genera el cliente de Prisma (`postinstall`).
2. `cp .env.example .env` crea tu configuración. Los valores por defecto funcionan tal cual con el `docker-compose.yml`.
3. `docker compose up -d` levanta PostgreSQL en el puerto `5432` (usuario, contraseña y base: `recall`).
4. `npx prisma migrate deploy` aplica las migraciones versionadas en `prisma/migrations`.
5. `npm run build && npm start` compila y arranca el API en el puerto `PORT` (por defecto `3000`). Al arrancar imprime `Connected to the database...`.

Para desarrollo: `npm run dev` (recarga automática).

Si prefieres una base en la nube (Supabase, Neon, etc.), cambia `DATABASE_URL` en tu `.env` y omite `docker compose up -d`.

Verificación:

```bash
curl localhost:3000/health
curl localhost:3000/api/v1/recordings
```

### Variables de entorno

Todas están en `.env.example`. **Nunca se suben credenciales al repositorio** (`.env` está en `.gitignore`).

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del API (3000) |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (obligatoria) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales con las que Docker crea la BD |
| `AUTH_MODE` | `dummy` (por defecto en `.env.example`): no se exige token, y `register`/`login` solo usan la BD. `cognito`: autenticación real con Amazon Cognito |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` | Solo con `AUTH_MODE=cognito` |
| `AWS_*`, `S3_BUCKET`, `BEDROCK_MODEL_ID` | Reservadas para entregas siguientes |

> La autenticación real y los permisos se evalúan en la siguiente entrega. Con `AUTH_MODE=dummy` todas las rutas se pueden probar sin token.

## Scripts

| Script | Comando |
| --- | --- |
| `npm run dev` | `tsx watch src/index.ts` |
| `npm run build` | `prisma generate && tsc` |
| `npm start` | `node dist/index.js` |
| `npm run db:deploy` | `prisma migrate deploy` (aplica migraciones existentes) |
| `npm run db:migrate` | `prisma migrate dev` (crea una migración nueva en desarrollo) |
| `npm run db:generate` | `prisma generate` |

## Estructura

```
recall-api/
├── prisma/
│   ├── schema.prisma         # esquema de la base de datos
│   └── migrations/           # migraciones versionadas
├── src/
│   ├── index.ts              # conecta a la BD y arranca el servidor
│   ├── app.ts                # Express, cors, json, rutas, notFound, errorHandler
│   ├── config/env.ts         # variables de entorno
│   ├── lib/                  # prisma, cognito, ApiError
│   ├── middlewares/          # auth, validate, errorHandler, notFound
│   ├── schemas/              # esquemas zod de body, params y query por módulo
│   ├── models/               # tipos TypeScript por entidad
│   ├── controllers/          # lógica de cada endpoint (consultas con Prisma)
│   └── routes/               # un Router por módulo + index.ts
├── docker-compose.yml
├── prisma.config.ts
├── .env.example
└── package.json
```

## Modelo de datos y relaciones

- `User` 1 — N `Recording`
- `Recording` 1 — 1 `Transcription` (`recordingId` único)
- `Recording` 1 — N `Summary`
- Índices únicos: `User.email`, `User.cognitoSub`, `Transcription.recordingId`.

Relaciones visibles en las respuestas:

- `GET /users/:id` incluye las `recordings` del usuario.
- `GET /recordings` incluye el `user` de cada grabación.
- `GET /recordings/:id` incluye `user`, `transcription` y `summaries`.
- Rutas anidadas: `GET /recordings/:id/summaries` y `GET /recordings/:id/transcription`.

## Política de borrado

Borrado **físico**, resuelto en el código (no con triggers ni `ON DELETE CASCADE`; las llaves foráneas son `RESTRICT`):

| Se elimina | Qué pasa |
| --- | --- |
| `Recording` | Se borran sus `Summary` y su `Transcription` y después la grabación, dentro de una transacción. Responde 204. |
| `User` | Si tiene grabaciones, **no se elimina**: responde 409. Primero hay que borrar sus grabaciones. |
| `Transcription` / `Summary` | Se elimina directamente (no tienen dependientes). Responde 204. |

## Endpoints

Prefijo `/api/v1` (excepto `/health`).

| Módulo | Método y ruta | Respuesta |
| --- | --- | --- |
| Health | `GET /health` | 200 `{ status: "ok" }` |
| Auth | `POST /auth/register` | 201 usuario creado; 409 si el correo ya existe |
| Auth | `POST /auth/login` | 200 `{ accessToken, user }` |
| Auth | `GET /auth/me` | 200 usuario autenticado (401 sin sesión) |
| Users | `GET /users` | 200 lista |
| Users | `GET /users/:id` | 200 usuario con sus grabaciones; 404; 400 |
| Users | `PATCH /users/:id` | 200; 404; 409 si el correo ya existe |
| Users | `DELETE /users/:id` | 204; 404; 409 si tiene grabaciones |
| Recordings | `GET /recordings` | 200 lista |
| Recordings | `GET /recordings/:id` | 200 con `user`, `transcription` y `summaries`; 404; 400 |
| Recordings | `GET /recordings/:id/summaries` | 200 lista de resúmenes |
| Recordings | `GET /recordings/:id/transcription` | 200 transcripción; 404 si no tiene |
| Recordings | `POST /recordings` | 201; 404 si el `userId` no existe |
| Recordings | `PATCH /recordings/:id` | 200; 404 |
| Recordings | `DELETE /recordings/:id` | 204 (borra dependientes); 404 |
| Recordings | `POST /recordings/:id/process` | 202 grabación `PROCESSING` |
| Transcriptions | `GET /transcriptions` | 200 lista |
| Transcriptions | `GET /transcriptions/:id` | 200; 404; 400 |
| Transcriptions | `POST /transcriptions` | 201; 404 si no existe la grabación; 409 si ya tiene transcripción |
| Transcriptions | `PATCH /transcriptions/:id` | 200; 404 |
| Transcriptions | `DELETE /transcriptions/:id` | 204; 404 |
| Summaries | `GET /summaries` | 200 lista |
| Summaries | `GET /summaries/:id` | 200; 404; 400 |
| Summaries | `POST /summaries` | 201; 404 si no existe la grabación |
| Summaries | `PATCH /summaries/:id` | 200; 404 |
| Summaries | `DELETE /summaries/:id` | 204; 404 |

Cualquier otra ruta responde 404 en JSON.

Filtros opcionales en los listados (validados): `GET /recordings?status=DONE&userId=<uuid>`, `GET /summaries?recordingId=<uuid>&template=CLASS`, `GET /transcriptions?recordingId=<uuid>`.

Formato de respuesta:

```json
{ "data": { "id": "…", "title": "Clase de Bases de Datos", "status": "UPLOADED" }, "message": "Recording created" }
```

## Validaciones y errores

**Validación.** El middleware reutilizable `validate({ body, params, query })` ([src/middlewares/validate.ts](src/middlewares/validate.ts)) corre antes del controlador, con esquemas zod por módulo en [src/schemas/](src/schemas/). Revisa campos obligatorios, tipos, longitudes, formatos (correo, UUID), rangos y enums. Los bodies son estrictos: un campo desconocido es un error, y el resultado validado reemplaza a `req.body`. Si algo falla responde 400 con el detalle de cada campo:

```json
{
  "error": {
    "message": "Invalid data",
    "details": [
      { "field": "email", "message": "Must be a valid email" },
      { "field": "durationSec", "message": "Must be 0 or more" }
    ]
  }
}
```

**Errores.** Todos pasan por el middleware central [src/middlewares/errorHandler.ts](src/middlewares/errorHandler.ts) y responden `{ "error": { "message": "…" } }` (con `details` solo en validación). Nunca incluyen stack trace ni códigos de la BD: ese detalle se imprime solo en la consola del servidor.

| Situación | Status |
| --- | --- |
| Body/params/query inválidos, JSON mal formado, valor demasiado largo para la BD | 400 |
| Falta o es inválido el token (solo `AUTH_MODE=cognito`) | 401 |
| Recurso inexistente (`P2025`), ruta inexistente | 404 |
| Duplicado (`P2002`), usuario con grabaciones, referencia inválida (`P2003`) | 409 |
| Body demasiado grande | 413 |
| Cualquier otro error | 500 `Internal server error` |

## Integrantes

- **Integrante 1:** auth, users, recordings
- **Integrante 2:** transcriptions, summaries, Prisma y Docker
