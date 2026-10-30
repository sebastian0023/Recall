# Recall API

**Recall** es el REST API de una plataforma web que recibe audio de reuniones, clases y entrevistas, lo transcribe (Amazon Transcribe) y genera resúmenes con IA (Amazon Bedrock), sin depender de un dispositivo dedicado.

## Alcance de la Entrega 2

- Persistencia real con PostgreSQL + Prisma: CRUD de users, recordings, transcriptions y summaries.
- Conexión a la BD al arrancar (si falla, mensaje claro y el proceso termina).
- Códigos HTTP correctos (200/201/204/400/404/409) y errores traducidos en un middleware central.
- Validación de body, params y query con zod antes de llegar al controlador, con el error indicando qué campo falló.
- Datos de prueba repetibles con `npm run seed`.
- Colección de Postman en [docs/api.postman_collection.json](docs/api.postman_collection.json), con casos de error.
- Vistas con Handlebars (layout con navegación, listado y detalle de grabaciones) con datos reales de la BD.
- CI/CD con GitHub Actions: ESLint, typecheck/build, migraciones + seed + colección, SonarQube e imagen Docker.

El documento del proyecto (versión 2) está en la raíz: [documentacion.pdf](documentacion.pdf). Su fuente editable es [docs/documentacion.md](docs/documentacion.md): para regenerar el PDF, abre el archivo en VS Code con la extensión **Markdown PDF** (`yzane.markdown-pdf`, recomendada en `.vscode/extensions.json`), haz clic derecho → *Markdown PDF: Export (pdf)* y reemplaza `documentacion.pdf` en la raíz con el resultado. El encabezado y el pie de página ya están configurados en `.vscode/settings.json`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript (`strict`) |
| Validación | zod |
| Runtime | Node.js 24 LTS |
| Framework | Express 5 |
| Base de datos | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 |
| Vistas | Handlebars (express-handlebars) |
| Linter | ESLint + typescript-eslint |
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
npm run seed
npm run build && npm start
```

1. `npm ci` instala las dependencias y genera el cliente de Prisma (`postinstall`).
2. `cp .env.example .env` crea tu configuración. Los valores por defecto funcionan tal cual con el `docker-compose.yml` (incluye `AUTH_MODE=dummy`, necesario para probar sin Cognito).
3. `docker compose up -d` levanta PostgreSQL en el puerto `5432` (usuario, contraseña y base: `recall`). Espera unos segundos a que acepte conexiones antes del siguiente paso.
4. `npx prisma migrate deploy` aplica las migraciones versionadas en `prisma/migrations`.
5. `npm run seed` limpia la BD y carga los datos de prueba (ver [Datos de prueba](#datos-de-prueba-seed)).
6. `npm run build && npm start` compila y arranca el API en el puerto `PORT` (por defecto `3000`). Al arrancar imprime `Connected to the database...`.
7. Abre <http://localhost:3000> para ver las vistas, e importa la colección de Postman para probar el API.

Para desarrollo: `npm run dev` (recarga automática).

Si prefieres una base en la nube (Supabase, Neon, etc.), cambia `DATABASE_URL` en tu `.env` y omite `docker compose up -d`.

Verificación:

```bash
curl localhost:3000/health
curl localhost:3000/api/v1/recordings -H "Authorization: Bearer dummy-11111111-1111-4111-8111-000000000001"
```

### Variables de entorno

Todas están en `.env.example`. **Nunca se suben credenciales al repositorio** (`.env` está en `.gitignore`).

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del API (3000) |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (obligatoria) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales con las que Docker crea la BD |
| `AUTH_MODE` | `dummy` (por defecto en `.env.example`): `register`/`login` solo usan la BD y el token es `dummy-<userId>`; no se permite con `NODE_ENV=production`. `cognito`: autenticación real con Amazon Cognito |
| `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET` | Solo con `AUTH_MODE=cognito` |
| `AWS_*`, `S3_BUCKET`, `BEDROCK_MODEL_ID` | Reservadas para entregas siguientes |

> Todas las rutas del API, excepto `/health`, `register`, `confirm` y `login`, exigen `Authorization: Bearer <token>`, también con `AUTH_MODE=dummy`. Ver [Roles y permisos](#roles-y-permisos).

## Scripts

| Script | Comando |
| --- | --- |
| `npm run dev` | `tsx watch src/index.ts` |
| `npm run build` | `prisma generate && tsc` |
| `npm start` | `node dist/index.js` |
| `npm run db:deploy` | `prisma migrate deploy` (aplica migraciones existentes) |
| `npm run db:migrate` | `prisma migrate dev` (crea una migración nueva en desarrollo) |
| `npm run db:generate` | `prisma generate` |
| `npm run seed` | `tsx prisma/seed.ts` (limpia y carga los datos de prueba) |
| `npm run lint` | ESLint sobre todo el proyecto (`npm run lint:fix` corrige lo automático) |
| `npm run typecheck` | `tsc --noEmit` |

## Datos de prueba (seed)

`npm run seed` ([prisma/seed.ts](prisma/seed.ts)) borra el contenido de las 4 tablas y vuelve a cargar los mismos registros dentro de una transacción. Se puede correr las veces que sea sin errores ni duplicados.

| Entidad | Registros | Notas |
| --- | --- | --- |
| `User` | 6 | Uno de ellos (Diego) sin grabaciones, para probar el borrado |
| `Recording` | 8 | Repartidas entre 5 usuarios y con los 4 estados (`UPLOADED`, `PROCESSING`, `DONE`, `FAILED`) |
| `Transcription` | 5 | Una por cada grabación `DONE`, con segmentos por hablante |
| `Summary` | 6 | De las 3 plantillas; una grabación tiene 2 resúmenes |

Los ids son fijos y fáciles de reconocer (`11111111-…-000000000001` = user 1, `22222222-…` = recordings, `33333333-…` = transcriptions, `44444444-…` = summaries), así la colección de Postman funciona justo después del seed.

## Roles y permisos

Cada usuario tiene un `role` (enum `USER` | `ADMIN`, por defecto `USER`). El middleware `auth` identifica al usuario a partir del token y [src/middlewares/authorize.ts](src/middlewares/authorize.ts) y [src/lib/permissions.ts](src/lib/permissions.ts) revisan lo que puede hacer. Sin token o con un token inválido responde 401; sin permiso, 403. En grabaciones, transcripciones y resúmenes, un id inexistente responde 404 antes de revisar al dueño.

| Acción | Invitado | Usuario | Admin |
| --- | --- | --- | --- |
| Registrarse, confirmar correo, iniciar sesión | Sí | Sí | Sí |
| Ver su perfil (`GET /auth/me`) | No | Sí | Sí |
| Listar usuarios | No | No | Sí |
| Ver o editar usuario | No | Propio | Todos |
| Cambiar el rol de un usuario | No | No | Sí |
| Eliminar usuario | No | No | Sí |
| Listar grabaciones | No | Propias | Todas |
| Crear grabación | No | A su nombre | Para cualquier usuario |
| Ver, editar, procesar o eliminar grabación | No | Propias | Todas |
| Listar, ver, crear, editar o eliminar transcripciones y resúmenes | No | De sus grabaciones | Todos |
| Vistas web | No | Sus datos | Todos los datos |

En `POST /recordings`, `userId` es opcional: si no se envía, la grabación queda a nombre de quien la crea. Un usuario que envía el `userId` de otro recibe 403.

El rol se cambia con `PATCH /users/:id` y `{ "role": "ADMIN" }`, solo como administrador. Con `AUTH_MODE=cognito` el primer administrador se asigna directamente en la base de datos.

**Cómo probarlo con `AUTH_MODE=dummy`** (la contraseña no se verifica):

| Usuario del seed | Rol | Token |
| --- | --- | --- |
| `sebastian@recall.app` | `ADMIN` | `dummy-11111111-1111-4111-8111-000000000001` |
| `ana.lopez@recall.app` | `USER` | `dummy-11111111-1111-4111-8111-000000000003` |

```bash
curl localhost:3000/api/v1/recordings -H "Authorization: Bearer dummy-11111111-1111-4111-8111-000000000003"
```

En las vistas, entra en <http://localhost:3000/login> con cualquiera de esos correos. La sesión se guarda en una cookie `httpOnly`.

El detalle de esta entrega y sus evidencias están en [documentacion-entrega-2.pdf](documentacion-entrega-2.pdf) (fuente: [docs/documentacion-entrega-2.md](docs/documentacion-entrega-2.md)).

## Colección de peticiones

[docs/api.postman_collection.json](docs/api.postman_collection.json): en Postman, **Import** → selecciona el archivo.

- Carpetas por módulo: Health, Auth, Users, Recordings, Transcriptions, Summaries, Permisos y Errores generales.
- Las peticiones usan el token de `{{adminToken}}`; la carpeta Permisos prueba 401 y 403 con `{{userToken}}`. Con `AUTH_MODE=cognito`, reemplaza esas variables por el `accessToken` de `POST /auth/login`.
- Al menos una petición por endpoint, más los casos de error: cuerpo inválido, id inexistente, id mal formado, duplicado (409), JSON mal formado y ruta inexistente.
- La URL base es la variable de colección `{{baseUrl}}` (por defecto `http://localhost:3000`). Si cambias el puerto, cambia solo esa variable.
- Las variables `userId`, `recordingId`, `transcriptionId` y `summaryId` apuntan a registros del seed; `newUserId`, `newRecordingId`, etc. se llenan solas al crear recursos.
- Cada petición trae pruebas del status esperado. Para correr toda la colección en orden: **Run collection** en Postman, o desde la terminal:

```bash
npx newman run docs/api.postman_collection.json
```

## Vistas

Hechas con Handlebars ([express-handlebars](https://github.com/express-handlebars/express-handlebars)) y servidas por el mismo API, fuera de `/api/v1`. Las plantillas están en [views/](views/) y el CSS en [public/](public/).

| Ruta | Vista |
| --- | --- |
| `GET /` | Inicio: conteo de cada tabla y últimas grabaciones |
| `GET /recordings` | Listado de grabaciones con su usuario, estado, duración y número de resúmenes; filtro por estado (`?status=DONE`) |
| `GET /recordings/:id` | Detalle: datos de la grabación, usuario, transcripción por hablante y resúmenes |
| `GET /users` | Listado de usuarios con su número de grabaciones (solo administradores) |
| `GET /login` · `POST /login` · `POST /logout` | Inicio y cierre de sesión de las vistas |

Todas usan el layout [views/layouts/main.hbs](views/layouts/main.hbs) con la barra de navegación. Los parámetros se validan con el mismo middleware `validate` del API: un id mal formado muestra una página de error 400, y uno inexistente, una página 404.

## CI/CD (GitHub Actions)

Los workflows están en [.github/workflows/](.github/workflows/) y corren en cada `git push` (cualquier rama) y en los Pull Requests hacia `develop` y `main`.

| Workflow | Qué hace |
| --- | --- |
| `ci.yml` | **Lint** (ESLint), **typecheck + build** (`prisma validate`, `tsc`) y un job con PostgreSQL de servicio que aplica las migraciones, corre el seed dos veces (para comprobar que es repetible), arranca el API, corre la colección de Postman con newman y revisa que las vistas muestren datos |
| `sonarqube.yml` | Análisis de SonarQube Cloud con el reporte de ESLint y **Quality Gate**: si no pasa, el workflow falla |
| `docker.yml` | Construye la imagen con el [Dockerfile](Dockerfile); en push a `develop`/`main` la publica en GitHub Container Registry (`ghcr.io/<owner>/recall-api`) |

Para que SonarQube funcione hay que configurarlo una vez:

1. Entrar a <https://sonarcloud.io> con GitHub e importar el repositorio (organización `sebastian0023`).
2. En el proyecto, **Administration → Analysis Method**: desactivar *Automatic Analysis* (se usa el de GitHub Actions).
3. Generar un token (**My Account → Security**) y guardarlo en GitHub como secreto del repositorio `SONAR_TOKEN` (**Settings → Secrets and variables → Actions**).
4. Si la organización o la llave del proyecto son distintas, actualizarlas en [sonar-project.properties](sonar-project.properties).

## Estructura

```
recall-api/
├── .github/workflows/        # CI/CD: ci, sonarqube, docker
├── docs/
│   ├── api.postman_collection.json
│   ├── documentacion.md      # fuente editable del documento (Markdown PDF)
│   └── img/                  # logo y diagramas del documento
├── prisma/
│   ├── schema.prisma         # esquema de la base de datos
│   ├── migrations/           # migraciones versionadas
│   └── seed.ts               # datos de prueba (npm run seed)
├── public/                   # CSS de las vistas
├── views/                    # plantillas Handlebars (layouts/, recordings/, users/)
├── src/
│   ├── index.ts              # conecta a la BD y arranca el servidor
│   ├── app.ts                # Express, cors, json, rutas, notFound, errorHandler
│   ├── config/env.ts         # variables de entorno
│   ├── lib/                  # prisma, cognito, ApiError
│   ├── middlewares/          # auth, validate, errorHandler, notFound
│   ├── schemas/              # esquemas zod de body, params y query por módulo
│   ├── models/               # tipos TypeScript por entidad
│   ├── controllers/          # lógica de cada endpoint (consultas con Prisma) + vistas
│   └── routes/               # un Router por módulo + index.ts + view.routes.ts
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── sonar-project.properties
├── documentacion.pdf         # documento del proyecto (versión 2)
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
| Auth | `POST /auth/confirm` | 200 correo confirmado (con `AUTH_MODE=dummy` no verifica el código); 400 si el código no es de 6 dígitos |
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

- **Daniel Sebastián Macías Macías:** conexión, modelos, CRUD, validaciones, manejo de errores y autenticación
- **Emilio Daniel Guzmán Seda:** seed, vistas con Handlebars, colección de Postman y CI/CD
