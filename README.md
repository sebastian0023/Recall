# Recall API

**Recall** es el REST API de una plataforma web que recibe audio de reuniones, clases y entrevistas, lo transcribe (Amazon Transcribe) y genera resúmenes con IA (Amazon Bedrock), sin depender de un dispositivo dedicado.

## Qué incluye

- **Persistencia:** PostgreSQL 17 + Prisma 7, con CRUD de users, recordings, transcriptions y summaries, y migraciones versionadas.
- **Validación y errores:** zod valida body, params y query antes del controlador; un middleware central responde los errores en JSON con el status correcto.
- **Autenticación propia:** registro y login con contraseña (bcrypt) y sesión con JWT (HS256). Login con Google opcional (OAuth 2.0 / OpenID Connect).
- **Roles y permisos:** `USER` y `ADMIN`, con revisión del rol y del dueño de cada recurso (401 sin sesión, 403 sin permiso).
- **Vistas con Handlebars:** registro, login, inicio, grabaciones, detalle y usuarios, con datos reales y la misma sesión.
- **Datos de prueba** repetibles con `npm run seed` y **colección de Postman** con casos de error y de seguridad.
- **Documentación interactiva** con Swagger (OpenAPI 3) en [`/docs`](http://localhost:3000/docs). Ver [Documentación del API](#documentación-del-api-swagger).
- **Logs** con pino: una línea por petición con su id (`X-Request-Id`), errores con stack y sin contraseñas ni tokens. Ver [Logs](#logs).
- **CI/CD** con GitHub Actions: ESLint, build, migraciones + seed + colección, SonarQube e imagen Docker.

El documento del proyecto (versión 3) está en la raíz: [documentacion.pdf](documentacion.pdf). Su fuente editable es [docs/documentacion.md](docs/documentacion.md): para regenerar el PDF, abre el archivo en VS Code con la extensión **Markdown PDF** (`yzane.markdown-pdf`, recomendada en `.vscode/extensions.json`), haz clic derecho → *Markdown PDF: Export (pdf)* y reemplaza `documentacion.pdf` en la raíz con el resultado. El encabezado y el pie de página ya están configurados en `.vscode/settings.json`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript (`strict`) |
| Validación | zod |
| Runtime | Node.js 24 LTS |
| Framework | Express 5 |
| Base de datos | PostgreSQL 17 (Docker Compose) |
| ORM | Prisma 7 |
| Autenticación | bcryptjs (contraseñas) + jsonwebtoken (JWT HS256) |
| Logging | pino + pino-http (pino-pretty en desarrollo) |
| Documentación del API | OpenAPI 3 con swagger-jsdoc + swagger-ui-express |
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
2. `cp .env.example .env` crea tu configuración. Los valores por defecto funcionan tal cual con el `docker-compose.yml` (incluye un `JWT_SECRET` de desarrollo; para un servidor real genera uno propio, ver [Variables de entorno](#variables-de-entorno)).
3. `docker compose up -d` levanta PostgreSQL en el puerto `5432` (usuario, contraseña y base: `recall`) y Mailpit, el servidor de correo de pruebas (ver [Correo](#correo)). Espera unos segundos a que acepte conexiones antes del siguiente paso.
4. `npx prisma migrate deploy` aplica las migraciones versionadas en `prisma/migrations`.
5. `npm run seed` limpia la BD y carga los datos de prueba (ver [Datos de prueba](#datos-de-prueba-seed)).
6. `npm run build && npm start` compila y arranca el API en el puerto `PORT` (por defecto `3000`). Al arrancar escribe en el log `Connected to the database. Recall API listening`.
7. Abre <http://localhost:3000>: te lleva a `/login`. Entra con un usuario del seed (ver [Roles y permisos](#roles-y-permisos)) o crea una cuenta en `/register`. Para probar el API, abre la documentación interactiva en <http://localhost:3000/docs> o importa la colección de Postman.

Para desarrollo: `npm run dev` (recarga automática). Cada petición escribe una línea en la terminal (ver [Logs](#logs)).

Si prefieres una base en la nube (Supabase, Neon, etc.), cambia `DATABASE_URL` en tu `.env` y omite `docker compose up -d`.

Verificación:

```bash
curl localhost:3000/health
curl -s localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana.lopez@recall.app","password":"Recall2026!"}'   # devuelve data.accessToken
curl localhost:3000/api/v1/recordings -H "Authorization: Bearer <accessToken>"
```

### Variables de entorno

Todas están en `.env.example`. **Nunca se suben credenciales al repositorio** (`.env` está en `.gitignore`).

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto del API (3000) |
| `NODE_ENV` | `development` (por defecto) o `production`. En producción los logs salen en JSON |
| `LOG_LEVEL` | Nivel mínimo del log: `fatal`, `error`, `warn`, `info` (por defecto), `debug`, `trace` o `silent`. Ver [Logs](#logs) |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (obligatoria) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales con las que Docker crea la BD |
| `JWT_SECRET` | Secreto con el que se firman los JWT (obligatorio, mínimo 32 caracteres). El valor de `.env.example` es solo de desarrollo y se rechaza con `NODE_ENV=production`. Para generar uno: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | Duración de la sesión: segundos (`3600`) o un número con unidad (`30s`, `15m`, `1h`, `7d`). Por defecto `1h`. Para probar un token expirado, bájala (p. ej. `5s`) y reinicia el API |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Servidor SMTP. Por defecto `localhost:1025` (Mailpit, sin autenticación). Ver [Correo](#correo) |
| `MAIL_FROM` | Remitente de los correos. Por defecto `Recall <no-reply@recall.local>` |
| `APP_URL` | Dirección pública del API; con ella se arman los enlaces de los correos. Por defecto `http://localhost:<PORT>` |
| `VERIFY_TOKEN_TTL` | Vigencia del enlace de verificación de correo, con el mismo formato que `JWT_EXPIRES_IN`. Por defecto `24h` |
| `RESET_TOKEN_TTL` | Vigencia del enlace para recuperar la contraseña. Por defecto `1h` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Login con Google (opcional). Sin ellas el botón no aparece. Ver [Login con Google](#login-con-google) |
| `AWS_*`, `S3_BUCKET`, `BEDROCK_MODEL_ID` | Reservadas para entregas siguientes |

> Todas las rutas del API, excepto `/health`, `register` y `login`, exigen `Authorization: Bearer <token>`. Ver [Roles y permisos](#roles-y-permisos).

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

`npm run seed` ([prisma/seed.ts](prisma/seed.ts)) borra el contenido de las 5 tablas y vuelve a cargar los mismos registros dentro de una transacción. Se puede correr las veces que sea sin errores ni duplicados.

| Entidad | Registros | Notas |
| --- | --- | --- |
| `User` | 6 | Uno de ellos (Diego) sin grabaciones, para probar el borrado. Todos con `emailVerified: true` |
| `Recording` | 8 | Repartidas entre 5 usuarios y con los 4 estados (`UPLOADED`, `PROCESSING`, `DONE`, `FAILED`) |
| `Transcription` | 5 | Una por cada grabación `DONE`, con segmentos por hablante |
| `Summary` | 6 | De las 3 plantillas; una grabación tiene 2 resúmenes |

Los ids son fijos y fáciles de reconocer (`11111111-…-000000000001` = user 1, `22222222-…` = recordings, `33333333-…` = transcriptions, `44444444-…` = summaries), así la colección de Postman funciona justo después del seed.

## Roles y permisos

Cada usuario tiene un `role` (enum `USER` | `ADMIN`, por defecto `USER`). El middleware `requireAuth` verifica el JWT, lee al usuario de la BD (así el rol siempre está al día) y lo deja en `req.user`; [src/middlewares/authorize.ts](src/middlewares/authorize.ts) y [src/lib/permissions.ts](src/lib/permissions.ts) revisan lo que puede hacer. El token no guarda el rol. Sin token, con un token inválido, alterado o vencido responde 401; sin permiso, 403. En grabaciones, transcripciones y resúmenes, un id inexistente responde 404 antes de revisar al dueño.

| Acción | Invitado | Usuario | Admin |
| --- | --- | --- | --- |
| Registrarse e iniciar sesión | Sí | Sí | Sí |
| Ver su perfil (`GET /auth/me`) | No | Sí | Sí |
| Listar usuarios | No | No | Sí |
| Ver o editar usuario | No | Propio | Todos |
| Cambiar el rol de un usuario | No | No | Sí |
| Eliminar usuario | No | No | Sí |
| Listar grabaciones | No | Propias | Todas |
| Crear grabación | No | A su nombre, **con el correo verificado** | Para cualquier usuario (con el correo verificado) |
| Procesar grabación | No | Propias, **con el correo verificado** | Todas (con el correo verificado) |
| Ver, editar o eliminar grabación | No | Propias | Todas |
| Reenviar el correo de verificación | No | Sí | Sí |
| Listar, ver, crear, editar o eliminar transcripciones y resúmenes | No | De sus grabaciones | Todos |
| Vistas web | No | Sus datos | Todos los datos |

En `POST /recordings`, `userId` es opcional: si no se envía, la grabación queda a nombre de quien la crea. Un usuario que envía el `userId` de otro recibe 403.

El rol se cambia con `PATCH /users/:id` y `{ "role": "ADMIN" }`, solo como administrador. El registro siempre crea usuarios `USER` (enviar `role` responde 400); el primer administrador viene del seed o se asigna directamente en la base de datos.

**Cómo probarlo.** `npm run seed` crea todos los usuarios con la contraseña `Recall2026!` (guardada con bcrypt en la BD):

| Usuario del seed | Rol | Contraseña |
| --- | --- | --- |
| `sebastian@recall.app` | `ADMIN` | `Recall2026!` |
| `ana.lopez@recall.app` | `USER` | `Recall2026!` |

Los demás usuarios del seed (`emilio@`, `carlos.ramirez@`, `mariana.torres@`, `diego.hernandez@`, todos `@recall.app`) son `USER` y usan la misma contraseña.

```bash
TOKEN=$(curl -s localhost:3000/api/v1/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana.lopez@recall.app","password":"Recall2026!"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')
curl localhost:3000/api/v1/recordings -H "Authorization: Bearer $TOKEN"
```

En las vistas, entra en <http://localhost:3000/login> con cualquiera de esos correos. La sesión se guarda en una cookie `httpOnly`.

## Correo

El API manda correos con [nodemailer](https://nodemailer.com). En desarrollo se usa **Mailpit**, un servidor SMTP de pruebas que no necesita cuenta y guarda los correos para verlos en el navegador.

1. `docker compose up -d` levanta Mailpit junto con la base de datos (SMTP en el puerto `1025`, web en el `8025`).
2. En tu `.env` deja los valores de `.env.example`: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`, `SMTP_USER` y `SMTP_PASS` vacías, `MAIL_FROM` y `APP_URL=http://localhost:3000` (cámbialo si el API corre en otra dirección o puerto, porque de ahí salen los enlaces de los correos).
3. Abre <http://localhost:8025>: ahí aparece cada correo con su versión HTML y su versión de texto.

Si prefieres Ethereal, Mailtrap o un SMTP real, solo cambian `SMTP_*` y `MAIL_FROM`; el código no se toca.

**Si el envío falla** (por ejemplo, Mailpit apagado), el error no se lanza: la petición responde igual y queda en el log un `warn` `Email not sent` con el tipo de correo, el usuario y el motivo. El log nunca incluye el enlace ni el token.

**Dónde está cada cosa**
- [src/services/mail.service.ts](src/services/mail.service.ts): el único lugar que crea el transporte; una función por correo (`sendVerificationEmail`, `sendPasswordResetEmail`).
- [src/services/mail.templates.ts](src/services/mail.templates.ts): el layout común y el contenido de cada correo.
- [src/lib/appLink.ts](src/lib/appLink.ts): arma los enlaces con `APP_URL`; ningún dominio está escrito en el código.

## Verificación de correo

Al registrarse (por `POST /auth/register` o por la vista `/register`) el usuario queda con `emailVerified: false` y recibe un correo con un enlace `APP_URL/verify-email?token=…`. El token es de un solo uso y vence con `VERIFY_TOKEN_TTL` (24 h por defecto). Si el correo no sale, la cuenta se crea igual (201) y queda un `warn` en el log.

- **Verificar:** abrir el enlace (vista `GET /verify-email`) o `POST /auth/verify-email` con `{ "token": "…" }`. Token inválido, expirado o ya usado → 400 con un mensaje claro (`Invalid token`, `Token expired` o `Token already used`).
- **Reenviar:** `POST /auth/resend-verification` (con sesión) invalida el enlace anterior y manda uno nuevo. Si el correo **ya está verificado responde 200 sin enviar nada** (`Email already verified`). En las vistas, el aviso amarillo de arriba trae el botón "Reenviar enlace".
- **Google:** los usuarios que entran con Google quedan verificados, porque Google ya exige `email_verified`.

**Qué puede hacer un usuario sin verificar.** Iniciar sesión, leer y editar sus datos, y ver, editar y borrar sus grabaciones. **No puede subir ni procesar audio** (`POST /recordings` y `POST /recordings/:id/process`): el middleware `requireVerifiedEmail` ([src/middlewares/authorize.ts](src/middlewares/authorize.ts)) responde 403:

```json
{ "error": { "message": "Verifica tu correo para realizar esta acción", "code": "EMAIL_NOT_VERIFIED", "requestId": "…" } }
```

## Recuperar contraseña

1. **Pedir el enlace:** `POST /auth/forgot-password` con `{ "email": "…" }` (o la vista `/forgot-password`, a la que lleva el enlace "¿Olvidaste tu contraseña?" del login). **Siempre responde 200** con `"Si el correo está registrado, recibirás un enlace"`, exista o no el correo, y no espera el envío: ni la respuesta ni su tiempo revelan qué correos están registrados. Si el correo existe, manda un enlace `APP_URL/reset-password?token=…` de un solo uso que vence con `RESET_TOKEN_TTL` (1 h por defecto). Pedir otro enlace invalida el anterior.
2. **Guardar la contraseña nueva:** `POST /auth/reset-password` con `{ "token": "…", "password": "…" }`, o el formulario de la vista `GET /reset-password?token=…`. La contraseña sigue las mismas reglas que el registro (8 a 72 caracteres). Token inválido, expirado o ya usado → 400. Después del cambio, la contraseña anterior ya no sirve para iniciar sesión.

- **Usuarios de Google:** quien entra solo con Google no tiene contraseña; este mismo flujo le permite **crear** una.
- Restablecer la contraseña también deja el correo verificado, porque abrir el enlace prueba que el correo es suyo.
- Las sesiones que ya estaban abiertas siguen válidas hasta que vencen (`JWT_EXPIRES_IN`).
- Si el correo no sale, queda un `warn` en el log; el log nunca incluye el token ni la contraseña.

## Login con Google

Flujo OAuth 2.0 / OpenID Connect (código de autorización) que usa la **misma sesión** que el login con contraseña: al terminar, el API guarda el mismo JWT en la cookie `recall_session`, así que los permisos son idénticos.

**Configuración.** En [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials) crea un *OAuth client ID* de tipo **Aplicación web** y agrega como *URI de redireccionamiento autorizado* exactamente el valor de `GOOGLE_CALLBACK_URL`. Luego pon en tu `.env`:

```env
GOOGLE_CLIENT_ID=<id de cliente>
GOOGLE_CLIENT_SECRET=<secreto del cliente>
GOOGLE_CALLBACK_URL=http://localhost:3000/google_confirm
```

La ruta del callback se toma de `GOOGLE_CALLBACK_URL` (no está escrita en el código): si cambias la URL, cambia solo el `.env` y el URI autorizado en Google. Las credenciales nunca se suben al repositorio.

| Ruta | Qué hace |
| --- | --- |
| `GET /auth/google` | Genera `state` y `nonce`, los guarda en una cookie `httpOnly` de 10 minutos y redirige a Google. Aparece como botón **Continuar con Google** en `/login` |
| `GET <ruta de GOOGLE_CALLBACK_URL>` (por defecto `/google_confirm`) | Verifica `state`, cambia el código por el `id_token` y valida emisor, audiencia, vigencia, `nonce` y que el correo esté **verificado** por Google. Abre la sesión y redirige a `/` |

- **Vinculación por correo verificado:** si ya existe un usuario con ese correo (registrado con contraseña, sin importar mayúsculas), entra a esa cuenta; si no, se crea sin contraseña y con el **rol por defecto `USER`**. El rol nunca viene de Google. Un correo no verificado se rechaza.
- **Errores:** si el usuario cancela, el `state` no coincide, el correo no está verificado o Google rechaza el código, se vuelve a `/login` con un mensaje claro.
- Un usuario creado con Google no tiene contraseña, así que `POST /auth/login` le responde 401.

## Documentación del API (Swagger)

Con el API corriendo:

- **<http://localhost:3000/docs>**: documentación interactiva (Swagger UI). Es pública.
- **<http://localhost:3000/docs/openapi.json>**: la especificación OpenAPI 3 en JSON (sirve para importarla en Postman u otras herramientas).

**Probar rutas protegidas desde `/docs`.** Haz login en `POST /auth/login` con un usuario del seed, copia `data.accessToken`, haz clic en **Authorize** y pégalo (sin escribir `Bearer`). Swagger UI recuerda el token aunque recargues la página. Después, **Try it out** en cualquier ruta protegida.

**Cómo está armada.** La especificación se genera al arrancar con `swagger-jsdoc`:

- [src/docs/swagger.ts](src/docs/swagger.ts): la configuración general (`info`, `servers`, `tags` por módulo, `securitySchemes.bearerAuth`) y las rutas `/docs` y `/docs/openapi.json`.
- [src/docs/schemas.ts](src/docs/schemas.ts): los modelos (`User`, `Session`, `Recording`, `Transcription`, `Summary`, enums) y el formato de error (`Error`), definidos una sola vez en `components/schemas`, y las respuestas de error comunes (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`) en `components/responses`. Los endpoints los reutilizan con `$ref`. `User` nunca incluye la contraseña.
- Cada endpoint se documenta con un comentario `/** @openapi ... */` junto a su ruta, en el archivo de rutas de su módulo ([src/routes/](src/routes/)). Así, quien cambia una ruta ve su documentación. Las rutas protegidas declaran `security: [{ bearerAuth: [] }]`; las públicas, `security: []`.

`swagger-jsdoc` busca los comentarios en `src/routes/*.ts` con `npm run dev` y en `dist/routes/*.js` después de `npm run build` (el `tsconfig.json` no usa `removeComments`). Con `failOnErrors`, un comentario con YAML inválido detiene el arranque en lugar de desaparecer de `/docs`. El CI valida la especificación con [Redocly CLI](https://redocly.com/docs/cli/) en cada push.

## Logs

El API usa **[pino](https://getpino.io)**. Hay un solo logger, configurado en [src/lib/logger.ts](src/lib/logger.ts) y reutilizado en todo el proyecto; en `src/` no hay `console.log` (ESLint lo marca como error con `no-console`; el seed sí puede usarlo).

**Qué se registra**

- **Una línea por petición** ([src/middlewares/requestLogger.ts](src/middlewares/requestLogger.ts), con `pino-http`): método, ruta, código de respuesta y duración en ms (`responseTime`). Por ejemplo `GET /api/v1/recordings 200 12ms`.
- **Id de petición:** se toma del encabezado `X-Request-Id` si viene (hasta 128 caracteres: letras, números, `_`, `.`, `:` o `-`) o se genera con `crypto.randomUUID()`. Aparece como `reqId` en todas las líneas de esa petición, se regresa en el encabezado `X-Request-Id` de la respuesta y en el campo `requestId` de los errores (`{ "error": { "message", "details?", "code?", "requestId" } }`). Así un error que reporta un usuario se encuentra en el log.
- **Errores:** el middleware de errores escribe los errores inesperados (500) con su stack y su `reqId`. La respuesta nunca incluye el stack.
- **Eventos:** arranque del servidor, registro de usuarios (con contraseña o con Google), logins fallidos y la falta de conexión a la base de datos al arrancar.

**Niveles**

| Nivel | Cuándo |
| --- | --- |
| `fatal` | El API no puede arrancar (sin conexión a la base de datos) |
| `error` | Fallas: respuestas 5xx y errores inesperados, con stack |
| `warn` | Lo sospechoso o recuperable: respuestas 4xx, login fallido, login con Google rechazado |
| `info` | Eventos importantes: arranque, usuario registrado, cada petición 2xx/3xx |
| `debug` | Detalle de desarrollo: por qué se rechazó una petición (detalles de validación, error de Prisma traducido) |

El nivel se cambia con `LOG_LEVEL` en el `.env` (por defecto `info`); por ejemplo `LOG_LEVEL=debug npm run dev` muestra también el detalle de cada 4xx.

**Formato.** Con `NODE_ENV=production` cada evento es una línea JSON (`{"level":"info","time":"...","reqId":"...","msg":"GET /health 200 1ms",...}`), lista para un servicio de logs. En desarrollo sale en formato legible con `pino-pretty`, una línea por evento.

**Qué nunca se registra.** El logger tiene `redact` configurado: los campos `password`, `passwordHash`, `token`, `accessToken`, `authorization` y `cookie` (y los encabezados `Authorization`, `Cookie` y `Set-Cookie`) se escriben como `[Redacted]`. Además, la línea de cada petición no incluye encabezados ni body, y en la URL se ocultan los valores de `token`, `code` y `state` (`/verify-email?token=[Redacted]`). El CI corre la colección completa y revisa que el log no contenga la contraseña del seed ni ningún JWT.

## Colección de peticiones

[docs/api.postman_collection.json](docs/api.postman_collection.json): en Postman, **Import** → selecciona el archivo.

- Carpetas por módulo: Health, Auth, Users, Recordings, Transcriptions, Summaries, Permisos y Errores generales.
- Las peticiones usan el token de `{{adminToken}}`; la carpeta Permisos prueba 401 y 403 con `{{userToken}}`. Las dos variables se llenan solas: las peticiones de login de la carpeta Auth guardan el `accessToken` del admin (`adminToken`) y de Ana López (`userToken`), así que hay que correr la carpeta Auth antes que las demás (Run collection ya lo hace en orden).
- Al menos una petición por endpoint, más los casos de error: cuerpo inválido, id inexistente, id mal formado, duplicado (409), JSON mal formado y ruta inexistente.
- Casos de seguridad: registro con `role: "ADMIN"` (400), login sin contraseña (400), la misma respuesta para contraseña incorrecta y correo inexistente, la contraseña nunca aparece en las respuestas, sin token (401) y tokens alterados (401): `sub` cambiado, firma modificada, `alg: none` y firmado con otra clave. Los tokens alterados se generan en el *pre-request* a partir de un token real.
- **Token expirado:** no se puede automatizar en la colección. Para probarlo, pon `JWT_EXPIRES_IN=5s` en el `.env`, reinicia el API, inicia sesión, espera 5 segundos y repite la petición: responde 401 `Token expired`.
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
| `GET /register` · `POST /register` | Crear cuenta (nombre, correo y contraseña). Siempre crea un `USER`, inicia la sesión y redirige a `/`. Muestra errores por campo y 409 si el correo ya existe |
| `GET /login` · `POST /login` · `POST /logout` | Inicio y cierre de sesión de las vistas (con botón de Google si está configurado) |
| `GET /auth/google` · `GET /google_confirm` | Inicio y callback del login con Google |

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
│   └── img/                  # logo, diagramas y evidencias del documento
├── prisma/
│   ├── schema.prisma         # esquema de la base de datos
│   ├── migrations/           # migraciones versionadas
│   └── seed.ts               # datos de prueba (npm run seed)
├── public/                   # CSS de las vistas
├── views/                    # plantillas Handlebars (layouts/, recordings/, users/, login, register)
├── src/
│   ├── index.ts              # conecta a la BD y arranca el servidor
│   ├── app.ts                # Express, cors, json, rutas, notFound, errorHandler
│   ├── config/env.ts         # variables de entorno
│   ├── docs/                 # swagger.ts (configuración OpenAPI y /docs) y schemas.ts (esquemas compartidos)
│   ├── lib/                  # prisma, password (bcrypt), token (JWT), oneTimeToken, appLink, permissions, ApiError, logger (pino)
│   ├── middlewares/          # auth, validate, errorHandler, notFound, requestLogger
│   ├── schemas/              # esquemas zod de body, params y query por módulo
│   ├── models/               # tipos TypeScript por entidad
│   ├── controllers/          # lógica de cada endpoint (consultas con Prisma) + vistas
│   ├── services/             # mail.service (nodemailer) y mail.templates (HTML y texto)
│   └── routes/               # un Router por módulo + index.ts + view.routes.ts
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── sonar-project.properties
├── documentacion.pdf         # documento del proyecto (versión 3)
├── prisma.config.ts
├── .env.example
└── package.json
```

## Modelo de datos y relaciones

- `User` 1 — N `Recording`
- `Recording` 1 — 1 `Transcription` (`recordingId` único)
- `Recording` 1 — N `Summary`
- `User` 1 — N `AuthToken`: tokens de un solo uso (`VERIFY_EMAIL` o `RESET_PASSWORD`) con `expiresAt` y `usedAt`. En la BD solo se guarda el `sha256` del token (`tokenHash`); el token en claro solo viaja en el enlace del correo y `tokenHash` nunca aparece en una respuesta.
- `User.emailVerified` indica si el usuario confirmó su correo (`false` al registrarse; los usuarios que ya existían al crear la columna quedaron en `true`).
- Índices únicos: `User.email`, `Transcription.recordingId`, `AuthToken.tokenHash`.
- `User.passwordHash` guarda el hash bcrypt (nulo para usuarios que entren solo con un proveedor externo). Prisma lo omite de todas las consultas y nunca aparece en una respuesta.

Relaciones visibles en las respuestas:

- `GET /users/:id` incluye las `recordings` del usuario.
- `GET /recordings` incluye el `user` de cada grabación.
- `GET /recordings/:id` incluye `user`, `transcription` y `summaries`.
- Rutas anidadas: `GET /recordings/:id/summaries` y `GET /recordings/:id/transcription`.

## Política de borrado

Borrado **físico**, resuelto en el código (no con triggers; las llaves foráneas son `RESTRICT`, salvo la de `AuthToken`):

| Se elimina | Qué pasa |
| --- | --- |
| `Recording` | Se borran sus `Summary` y su `Transcription` y después la grabación, dentro de una transacción. Responde 204. |
| `User` | Si tiene grabaciones, **no se elimina**: responde 409. Primero hay que borrar sus grabaciones. |
| `AuthToken` | Se borran junto con su usuario (`ON DELETE CASCADE`). Es la única excepción a `RESTRICT`: son datos internos de seguridad que el API no expone. |
| `Transcription` / `Summary` | Se elimina directamente (no tienen dependientes). Responde 204. |

## Endpoints

Prefijo `/api/v1` (excepto `/health`).

| Módulo | Método y ruta | Respuesta |
| --- | --- | --- |
| Health | `GET /health` | 200 `{ status: "ok" }` |
| Auth | `POST /auth/register` | 201 usuario creado (rol `USER`); 409 si el correo ya existe; 400 si falta un campo, la contraseña mide menos de 8 o se envía `role` |
| Auth | `POST /auth/login` | 200 `{ accessToken, tokenType, expiresIn, user }`; 401 `Incorrect email or password` (mismo mensaje si el correo no existe o la contraseña es incorrecta) |
| Auth | `GET /auth/me` | 200 usuario autenticado, con `emailVerified` (401 sin sesión) |
| Auth | `POST /auth/forgot-password` | 200 siempre con el mismo mensaje, exista o no el correo; 400 si el correo no tiene formato válido |
| Auth | `POST /auth/reset-password` | 200 contraseña actualizada; 400 si el token es inválido, expiró o ya se usó, o la contraseña no cumple las reglas |
| Auth | `POST /auth/verify-email` | 200 usuario con `emailVerified: true`; 400 si el token es inválido, expiró o ya se usó |
| Auth | `POST /auth/resend-verification` | 200 correo reenviado (o ya verificado, sin enviar nada); 401 sin sesión |
| Users | `GET /users` | 200 lista (solo `ADMIN`) |
| Users | `GET /users/:id` | 200 usuario con sus grabaciones; 404; 400 |
| Users | `PATCH /users/:id` | 200; 404; 409 si el correo ya existe |
| Users | `DELETE /users/:id` | 204; 404; 409 si tiene grabaciones |
| Recordings | `GET /recordings` | 200 lista |
| Recordings | `GET /recordings/:id` | 200 con `user`, `transcription` y `summaries`; 404; 400 |
| Recordings | `GET /recordings/:id/summaries` | 200 lista de resúmenes |
| Recordings | `GET /recordings/:id/transcription` | 200 transcripción; 404 si no tiene |
| Recordings | `POST /recordings` | 201; 403 `EMAIL_NOT_VERIFIED` si el correo no está verificado; 404 si el `userId` no existe |
| Recordings | `PATCH /recordings/:id` | 200; 404 |
| Recordings | `DELETE /recordings/:id` | 204 (borra dependientes); 404 |
| Recordings | `POST /recordings/:id/process` | 202 grabación `PROCESSING`; 403 `EMAIL_NOT_VERIFIED` |
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
    ],
    "requestId": "3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3"
  }
}
```

**Errores.** Todos pasan por el middleware central [src/middlewares/errorHandler.ts](src/middlewares/errorHandler.ts) y responden `{ "error": { "message": "…", "requestId": "…" } }` (con `details` solo en validación y con `code` solo en algunos errores, p. ej. `EMAIL_NOT_VERIFIED`). `requestId` es el mismo del encabezado `X-Request-Id` y del log de esa petición. Nunca incluyen stack trace ni códigos de la BD: ese detalle solo se escribe en el log (ver [Logs](#logs)).

| Situación | Status |
| --- | --- |
| Body/params/query inválidos, JSON mal formado, valor demasiado largo para la BD | 400 |
| Falta el token, o es inválido, alterado o expiró | 401 |
| Correo sin verificar en una acción que lo exige | 403 `EMAIL_NOT_VERIFIED` |
| Recurso inexistente (`P2025`), ruta inexistente | 404 |
| Duplicado (`P2002`), usuario con grabaciones, referencia inválida (`P2003`) | 409 |
| Body demasiado grande | 413 |
| Cualquier otro error | 500 `Internal server error` |

## Integrantes

- **Daniel Sebastián Macías Macías:** conexión, modelos, CRUD, validaciones, manejo de errores y autenticación
- **Emilio Daniel Guzmán Seda:** seed, vistas con Handlebars (incluido el registro), roles y permisos, colección de Postman y casos de seguridad, CI/CD y documento
