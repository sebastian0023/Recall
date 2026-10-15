# Recall API

**Recall** es el REST API de una plataforma web que recibe audio de reuniones, clases y entrevistas, lo transcribe (Amazon Transcribe) y genera resúmenes con IA (Amazon Bedrock), sin depender de un dispositivo dedicado.

## Alcance de la Entrega 1

Estructura base del API. Los controladores **existen pero responden datos dummy**:

- No hay lógica real de auth (no se firma ni verifica JWT, no se hashean contraseñas).
- No hay consultas reales a la base de datos.
- No hay llamadas a S3, Transcribe ni Bedrock.

Sí está listo: PostgreSQL en Docker y el esquema de Prisma para la primera migración.

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript (`strict`) |
| Runtime | Node.js 24 LTS |
| Framework | Express 5 |
| Base de datos | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 |
| Gestor de paquetes | npm |
| Desarrollo | tsx |

## Requisitos

- Node.js 24
- Docker

## Cómo correrlo

```bash
npm install express cors dotenv @prisma/client @prisma/adapter-pg pg
npm install -D typescript tsx prisma @types/express @types/cors @types/node @types/pg
cp .env.example .env
docker compose up -d
npx prisma migrate dev --name init
npm run dev
```

El API escucha en el puerto definido por `PORT` (por defecto `3000`).

Verificación:

```bash
curl localhost:3000/health
curl -X POST localhost:3000/api/v1/auth/register -H "Content-Type: application/json" -d '{"email":"ana@recall.app","password":"12345678","name":"Ana"}'
curl localhost:3000/api/v1/recordings -H "Authorization: Bearer dummy"
```

## Scripts

| Script | Comando |
| --- | --- |
| `npm run dev` | `tsx watch src/index.ts` |
| `npm run build` | `tsc` |
| `npm start` | `node dist/index.js` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:generate` | `prisma generate` |

## Estructura

```
recall-api/
├── prisma/schema.prisma      # esquema de la base de datos
├── src/
│   ├── index.ts              # entrada: app.listen(env.PORT)
│   ├── app.ts                # Express, cors, json, rutas, notFound, errorHandler
│   ├── config/env.ts         # variables de entorno
│   ├── lib/prisma.ts         # cliente de Prisma
│   ├── middlewares/          # auth, errorHandler, notFound
│   ├── models/               # tipos y datos dummy por entidad
│   ├── controllers/          # una función por endpoint
│   └── routes/               # un Router por módulo + index.ts
├── docker-compose.yml
├── prisma.config.ts
├── .env.example
├── tsconfig.json
└── package.json
```

- **Rutas (`routes/`)**: conectan cada método y ruta con su función del controlador y aplican `auth` donde corresponde. `routes/index.ts` los monta bajo `/api/v1`.
- **Controladores (`controllers/`)**: una función por endpoint; responden datos dummy tomados del modelo.
- **Modelos (`models/`)**: interfaces de TypeScript de cada entidad y sus datos de entrada, más registros dummy. En la Entrega 2 aquí irán las consultas con Prisma.
- **Middlewares (`middlewares/`)**: `auth` (exige `Authorization: Bearer <token>`, responde 401 si falta), `notFound` (404) y `errorHandler` (500).

## Endpoints

Prefijo `/api/v1` (excepto `/health`). "Auth: Sí" = la ruta exige el header `Authorization: Bearer <token>`.

| Módulo | Método y ruta | Auth | Respuesta dummy |
| --- | --- | --- | --- |
| Health | `GET /health` | No | 200 `{ status: "ok" }` |
| Auth | `POST /auth/register` | No | 201 usuario creado |
| Auth | `POST /auth/login` | No | 200 `{ token, user }` |
| Auth | `GET /auth/me` | Sí | 200 usuario |
| Users | `GET /users` | Sí | 200 lista |
| Users | `GET /users/:id` | Sí | 200 usuario |
| Users | `PATCH /users/:id` | Sí | 200 usuario actualizado |
| Users | `DELETE /users/:id` | Sí | 204 |
| Recordings | `GET /recordings` | Sí | 200 lista |
| Recordings | `GET /recordings/:id` | Sí | 200 grabación |
| Recordings | `POST /recordings` | Sí | 201 grabación `UPLOADED` |
| Recordings | `PATCH /recordings/:id` | Sí | 200 grabación actualizada |
| Recordings | `DELETE /recordings/:id` | Sí | 204 |
| Recordings | `POST /recordings/:id/process` | Sí | 202 grabación `PROCESSING` |
| Transcriptions | `GET /transcriptions` | Sí | 200 lista |
| Transcriptions | `GET /transcriptions/:id` | Sí | 200 transcripción |
| Transcriptions | `POST /transcriptions` | Sí | 201 transcripción |
| Transcriptions | `PATCH /transcriptions/:id` | Sí | 200 transcripción actualizada |
| Transcriptions | `DELETE /transcriptions/:id` | Sí | 204 |
| Summaries | `GET /summaries` | Sí | 200 lista |
| Summaries | `GET /summaries/:id` | Sí | 200 resumen |
| Summaries | `POST /summaries` | Sí | 201 resumen |
| Summaries | `PATCH /summaries/:id` | Sí | 200 resumen actualizado |
| Summaries | `DELETE /summaries/:id` | Sí | 204 |

Formato de respuesta:

```json
{ "data": { "id": "…", "title": "Clase de Bases de Datos", "status": "UPLOADED" }, "message": "Recording created (dummy)" }
```

Error:

```json
{ "error": { "message": "Route not found" } }
```

## Integrantes

- **Integrante 1:** auth, users, recordings
- **Integrante 2:** transcriptions, summaries, Prisma y Docker
