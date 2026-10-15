# Guía de archivos — Recall API (Entrega 1)

Esta guía explica qué debe hacer cada archivo del proyecto para que lo programen ustedes. No trae el código completo; solo indica la responsabilidad de cada archivo, qué debe exportar y los detalles que suelen causar errores.

**Orden recomendado:** configuración → base de datos → `env.ts` → middlewares → un módulo completo (recordings) → los demás módulos → `app.ts` e `index.ts` → README.

**Reparto sugerido:**
- **Integrante 1:** configuración, `app.ts`, `index.ts`, middlewares y los módulos auth, users y recordings.
- **Integrante 2:** Docker, Prisma, `lib/prisma.ts` y los módulos transcriptions y summaries.

---

## 1. Archivos de configuración (raíz)

### `package.json`
Se crea con `npm init -y` y luego se edita.
- Agregar `"type": "module"` para usar `import`/`export`.
- Scripts:
  - `"dev": "tsx watch src/index.ts"`
  - `"build": "tsc"`
  - `"start": "node dist/index.js"`
  - `"db:migrate": "prisma migrate dev"`
  - `"db:generate": "prisma generate"`
- Dependencias que se instalan:
  - Normales: `express`, `cors`, `dotenv`, `@prisma/client`, `@prisma/adapter-pg`, `pg`.
  - De desarrollo: `typescript`, `tsx`, `prisma`, `@types/express`, `@types/cors`, `@types/node`, `@types/pg`.

### `tsconfig.json`
Configura cómo TypeScript compila el proyecto. Opciones clave:
- `"target": "ES2022"`
- `"module": "NodeNext"` y `"moduleResolution": "NodeNext"`
- `"strict": true`
- `"esModuleInterop": true`, `"skipLibCheck": true`
- `"rootDir": "src"` y `"outDir": "dist"`

> ⚠️ Con `NodeNext`, **todos los imports de archivos propios llevan `.js` al final**, aunque el archivo sea `.ts`. Ejemplo: `import app from "./app.js"`. Si lo olvidan, el servidor no arranca.

### `.env.example`
Plantilla con todas las variables, **sin valores secretos reales**. Se sube al repo. Variables: `PORT`, `NODE_ENV`, `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `JWT_EXPIRES_IN`, y las de AWS vacías (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `BEDROCK_MODEL_ID`).

Cada integrante lo copia a `.env` y pone sus valores. El `.env` **no** se sube.

### `.gitignore`
Archivos que Git debe ignorar: `node_modules`, `dist`, `.env`, `src/generated`.

### `docker-compose.yml`
Levanta **solo PostgreSQL** (el API se corre con `npm run dev`, fuera de Docker).
- Un servicio `db` con la imagen `postgres:17`.
- `env_file: .env` para que tome `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`.
- Puerto `5432:5432`.
- Un volumen (por ejemplo `pgdata`) montado en `/var/lib/postgresql/data` para que los datos no se borren al apagar el contenedor.

---

## 2. Base de datos

### `prisma/schema.prisma`
Define las 4 tablas, los 2 enums y sus relaciones. Usen el archivo `schema.prisma` que ya tienen.

Puntos importantes de Prisma 7:
- El bloque `generator` usa `provider = "prisma-client"` y **requiere** `output = "../src/generated/prisma"`.
- El bloque `datasource` solo lleva `provider = "postgresql"`; **la URL no va aquí**, va en `prisma.config.ts`.

### `prisma.config.ts`
Le dice a Prisma dónde está el esquema, dónde guardar las migraciones y cuál es la URL de la base.
- Importa `"dotenv/config"` para leer el `.env`.
- Exporta `defineConfig({ ... })` (de `prisma/config`) con:
  - `schema: "prisma/schema.prisma"`
  - `migrations: { path: "prisma/migrations" }`
  - `datasource: { url: process.env["DATABASE_URL"] }`

Al correr `npm run db:migrate` se crea la carpeta `prisma/migrations` con el SQL de las tablas. Esa carpeta **sí** se sube al repo.

---

## 3. `src/config/env.ts`
Lee las variables de entorno en un solo lugar para no usar `process.env` por todo el código.
- Importa `"dotenv/config"`.
- Exporta un objeto `env` con `PORT` (convertido a número, con 3000 por defecto), `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` y `JWT_EXPIRES_IN`.
- Si falta `DATABASE_URL` o `JWT_SECRET`, lanza un `Error` con un mensaje claro. Así el servidor no arranca con la configuración incompleta.

---

## 4. `src/lib/prisma.ts`
Crea **una sola instancia** del cliente de Prisma y la exporta (patrón Singleton). En esta entrega todavía no se usa, pero debe existir para la siguiente.
- Importa `PrismaClient` desde `../generated/prisma/client.js` (la carpeta que genera Prisma).
- Importa `PrismaPg` desde `@prisma/adapter-pg`.
- Crea el adaptador con `new PrismaPg({ connectionString: env.DATABASE_URL })`.
- Crea y exporta `prisma = new PrismaClient({ adapter })`.

> La carpeta `src/generated` solo existe después de correr `npm run db:migrate` o `npm run db:generate`. Si TypeScript marca que no encuentra el import, corran primero uno de esos comandos.

---

## 5. Middlewares (`src/middlewares/`)

Un middleware es una función `(req, res, next)` que se ejecuta antes del controlador. Puede responder o llamar a `next()` para continuar.

### `auth.ts`
Protege las rutas que requieren sesión.
- Lee el header `Authorization`.
- Si no existe o no empieza con `"Bearer "`, responde **401** con `{ error: { message: "Unauthorized" } }` y **no** llama a `next()`.
- Si existe, guarda un usuario dummy en `res.locals.user` (por ejemplo `{ id: "...", email: "demo@recall.app" }`) y llama a `next()`.
- Dejen un comentario `// TODO Entrega 2: verificar el JWT con JWT_SECRET`.
- Export: `export function auth(req, res, next)`.

### `notFound.ts`
Se ejecuta cuando ninguna ruta coincide.
- Responde **404** con `{ error: { message: "Route not found" } }`.

### `errorHandler.ts`
Atrapa cualquier error que ocurra en rutas o controladores.
- **Debe tener 4 parámetros**: `(err, req, res, next)`. Si tiene menos, Express no lo reconoce como manejador de errores.
- Hace `console.error(err)` y responde **500** con `{ error: { message } }`.

---

## 6. Modelos (`src/models/`)

Un archivo por entidad: `user.model.ts`, `recording.model.ts`, `transcription.model.ts` y `summary.model.ts`. En esta entrega los modelos **no consultan la base**; solo definen tipos y datos de ejemplo.

Cada modelo debe tener:
1. **Una interfaz de la entidad** con los mismos campos que su tabla en `schema.prisma`. Ejemplo para recording: `id`, `userId`, `title`, `s3Key`, `durationSec`, `status`, `transcribeJobId`, `errorMessage`, `createdAt`, `updatedAt`.
2. **Interfaces de entrada** para crear y editar. Ejemplo: `CreateRecordingInput` (`title`, `s3Key`) y `UpdateRecordingInput` (`title` opcional).
3. **Un arreglo de datos dummy** exportado (por ejemplo `dummyRecordings`) con 2 o 3 registros realistas en español.
4. Un comentario `// TODO Entrega 2: reemplazar los datos dummy por consultas con prisma`.

Notas por modelo:
- **user:** la interfaz que se devuelve al cliente **no** debe incluir `passwordHash`. Pueden tener `User` (completo) y `PublicUser` (sin la contraseña).
- **recording:** `status` es uno de `"UPLOADED" | "PROCESSING" | "DONE" | "FAILED"`.
- **transcription:** `segments` es un arreglo de `{ speaker, startMs, endMs, text }`.
- **summary:** `template` es uno de `"MEETING" | "CLASS" | "INTERVIEW"`.

---

## 7. Controladores (`src/controllers/`)

Un archivo por módulo: `auth`, `user`, `recording`, `transcription` y `summary`. Cada endpoint es **una función exportada** con la forma `(req: Request, res: Response)`.

Reglas para todas las funciones:
- **No** consultan la base de datos; usan los datos dummy del modelo.
- Responden con `{ data, message }` y el código HTTP correcto.
- Cuando reciben datos (`req.body`) o un id (`req.params.id`), los incluyen en la respuesta para que se note que los recibieron.

Códigos HTTP:
| Operación | Código |
| --- | --- |
| Listar o ver | 200 |
| Crear | 201 |
| Editar | 200 |
| Eliminar | 204 (sin body: `res.status(204).send()`) |
| Iniciar procesamiento | 202 |

### `auth.controller.ts` (usa `user.model.ts`)
- `register`: toma `email`, `password` y `name` del body y responde 201 con un usuario dummy **sin la contraseña**.
- `login`: responde 200 con `{ token: "dummy-jwt-token", user }`.
- `me`: responde 200 con el usuario de `res.locals.user` (lo puso el middleware `auth`).

### `user.controller.ts`
- `getUsers` → 200 con la lista dummy.
- `getUserById` → 200 con un usuario cuyo `id` sea `req.params.id`.
- `updateUser` → 200 con el usuario y los campos del body aplicados.
- `deleteUser` → 204.

### `recording.controller.ts`
- `getRecordings`, `getRecordingById`, `createRecording` (status `"UPLOADED"`), `updateRecording`, `deleteRecording`.
- `processRecording` → 202 con la grabación y `status: "PROCESSING"`.

### `transcription.controller.ts` y `summary.controller.ts`
Las 5 funciones CRUD con el mismo patrón: `getX`, `getXById`, `createX`, `updateX`, `deleteX`.

---

## 8. Rutas (`src/routes/`)

### Un archivo por módulo (`auth.routes.ts`, `user.routes.ts`, …)
Cada uno crea un `Router` de Express, conecta cada método y ruta con su función del controlador y lo exporta con `export default router`.
- Las rutas son **relativas al módulo**. Por ejemplo, en `recording.routes.ts` se escribe `router.get("/", getRecordings)` y `router.get("/:id", getRecordingById)`, no `/recordings`.
- Agreguen el middleware `auth` antes del controlador en las rutas protegidas: `router.get("/", auth, getRecordings)`. Otra opción es `router.use(auth)` al inicio del archivo para proteger todas.
- En `auth.routes.ts`, solo `/me` lleva `auth`; `register` y `login` son públicas.

### `routes/index.ts`
Junta todos los routers en uno.
- Crea un `Router` y monta cada módulo con su prefijo:
  - `router.use("/auth", authRoutes)`
  - `router.use("/users", userRoutes)`
  - `router.use("/recordings", recordingRoutes)`
  - `router.use("/transcriptions", transcriptionRoutes)`
  - `router.use("/summaries", summaryRoutes)`
- Exporta el router.

---

## 9. `src/app.ts`
Crea y configura la aplicación de Express **sin** levantar el servidor.

Agrega las piezas en este orden (el orden importa):
1. `app.use(cors())`
2. `app.use(express.json())` para poder leer `req.body`.
3. `app.get("/health", ...)` que responde `{ status: "ok" }`.
4. `app.use("/api/v1", routes)` con el router de `routes/index.ts`.
5. `app.use(notFound)`, **después** de las rutas.
6. `app.use(errorHandler)`, siempre **al final**.

Exporta `app` con `export default app`.

---

## 10. `src/index.ts`
Punto de entrada. Es el archivo que ejecuta `npm run dev`.
- Importa `app` y `env`.
- Llama a `app.listen(env.PORT, ...)` e imprime en consola en qué puerto quedó escuchando.

Se separa de `app.ts` para que en el futuro las pruebas puedan usar la app sin abrir un puerto.

---

## 11. `README.md`
Ya está listo. Solo falta reemplazar `[Integrante 1]`, `[Integrante 2]` y `<url-del-repositorio>`.

---

## 12. Cómo probar que todo funciona

1. `docker compose up -d` y luego `npm run db:migrate`: deben crearse las tablas sin errores.
2. `npm run dev`: debe imprimir el puerto.
3. Pruebas con Postman, Thunder Client o `curl`:
   - `GET /health` → 200 `{ status: "ok" }`.
   - `POST /api/v1/auth/register` con body → 201.
   - `GET /api/v1/recordings` **sin** header → 401.
   - `GET /api/v1/recordings` con `Authorization: Bearer dummy` → 200 con la lista.
   - `DELETE /api/v1/recordings/123` con header → 204.
   - `GET /api/v1/no-existe` → 404.
4. `npm run build`: debe compilar sin errores de TypeScript.

### Errores comunes
| Error | Causa probable |
| --- | --- |
| `Cannot find module './app'` | Falta la extensión `.js` en el import |
| `Cannot find module '../generated/prisma/client.js'` | No se ha corrido `npm run db:migrate` o `db:generate` |
| `req.body` es `undefined` | Falta `express.json()` en `app.ts`, o está después de las rutas |
| Siempre responde 404 | `notFound` está antes de las rutas en `app.ts` |
| Los errores no llegan a `errorHandler` | La función no tiene exactamente 4 parámetros |
| No conecta a la base | El contenedor no está corriendo o `DATABASE_URL` no coincide con `POSTGRES_*` |

---

## Checklist de entrega
- [ ] Repositorio privado `recall-api` con acceso para fsevilla@gmail.com
- [ ] `package.json`, `tsconfig.json`, `.env.example`, `.gitignore`, `docker-compose.yml`, `prisma.config.ts`
- [ ] `prisma/schema.prisma` y la carpeta `prisma/migrations`
- [ ] `src/index.ts` y `src/app.ts`
- [ ] Middlewares `auth`, `notFound` y `errorHandler`
- [ ] 4 modelos, 5 controladores y 6 archivos de rutas
- [ ] Todos los endpoints responden datos dummy
- [ ] `README.md` con nombres y URL
- [ ] Documento del proyecto adjunto en la entrega