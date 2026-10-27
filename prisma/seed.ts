import { prisma } from "../src/lib/prisma.js";
import type { Prisma } from "../src/generated/prisma/client.js";

const id = (d: string, n: number) => `${d.repeat(8)}-${d.repeat(4)}-4${d.repeat(3)}-8${d.repeat(3)}-${String(n).padStart(12, "0")}`;
const USER = (n: number) => id("1", n);
const REC = (n: number) => id("2", n);
const TRANS = (n: number) => id("3", n);
const SUM = (n: number) => id("4", n);

const users: Prisma.UserCreateManyInput[] = [
    { id: USER(1), cognitoSub: "seed-sebastian", email: "sebastian@recall.app", name: "Sebastián Macías" },
    { id: USER(2), cognitoSub: "seed-emilio", email: "emilio@recall.app", name: "Emilio Guzmán" },
    { id: USER(3), cognitoSub: "seed-ana", email: "ana.lopez@recall.app", name: "Ana López" },
    { id: USER(4), cognitoSub: "seed-carlos", email: "carlos.ramirez@recall.app", name: "Carlos Ramírez" },
    { id: USER(5), cognitoSub: "seed-mariana", email: "mariana.torres@recall.app", name: "Mariana Torres" },
    { id: USER(6), cognitoSub: "seed-diego", email: "diego.hernandez@recall.app", name: "Diego Hernández" },
];

const recordings: Prisma.RecordingCreateManyInput[] = [
    { id: REC(1), userId: USER(1), title: "Clase de Bases de Datos: normalización", s3Key: "audio/seed/bd-normalizacion.mp3", durationSec: 3120, status: "DONE", transcribeJobId: "job-seed-1" },
    { id: REC(2), userId: USER(1), title: "Junta semanal del equipo Recall", s3Key: "audio/seed/junta-semanal.m4a", durationSec: 1845, status: "DONE", transcribeJobId: "job-seed-2" },
    { id: REC(3), userId: USER(2), title: "Entrevista a usuaria: hábitos de toma de notas", s3Key: "audio/seed/entrevista-notas.wav", durationSec: 1420, status: "DONE", transcribeJobId: "job-seed-3" },
    { id: REC(4), userId: USER(2), title: "Clase de Desarrollo en el Servidor: middlewares", s3Key: "audio/seed/servidor-middlewares.mp3", durationSec: 2980, status: "DONE", transcribeJobId: "job-seed-4" },
    { id: REC(5), userId: USER(3), title: "Reunión con asesor de tesis", s3Key: "audio/seed/asesor-tesis.m4a", durationSec: 2210, status: "DONE", transcribeJobId: "job-seed-5" },
    { id: REC(6), userId: USER(4), title: "Entrevista técnica: backend junior", s3Key: "audio/seed/entrevista-backend.mp3", durationSec: 2700, status: "PROCESSING", transcribeJobId: "job-seed-6" },
    { id: REC(7), userId: USER(5), title: "Clase de Cálculo: integrales por partes", s3Key: "audio/seed/calculo-integrales.mp3", durationSec: null, status: "UPLOADED" },
    { id: REC(8), userId: USER(3), title: "Llamada con cliente: requisitos del MVP", s3Key: "audio/seed/cliente-mvp.ogg", durationSec: 960, status: "FAILED", transcribeJobId: "job-seed-8", errorMessage: "El audio está vacío o dañado" },
];

const transcriptions: Prisma.TranscriptionCreateManyInput[] = [
    {
        id: TRANS(1),
        recordingId: REC(1),
        language: "es-MX",
        fullText:
            "Hoy vamos a ver normalización. La primera forma normal pide que cada columna tenga valores atómicos. La segunda forma normal elimina dependencias parciales de la llave primaria. ¿Alguien tiene dudas? Sí, ¿la tercera forma normal es obligatoria? En la práctica casi siempre conviene llegar a tercera forma normal.",
        segments: [
            { speaker: "Profesor", startMs: 0, endMs: 9200, text: "Hoy vamos a ver normalización. La primera forma normal pide que cada columna tenga valores atómicos." },
            { speaker: "Profesor", startMs: 9200, endMs: 17800, text: "La segunda forma normal elimina dependencias parciales de la llave primaria. ¿Alguien tiene dudas?" },
            { speaker: "Alumna", startMs: 17800, endMs: 21400, text: "Sí, ¿la tercera forma normal es obligatoria?" },
            { speaker: "Profesor", startMs: 21400, endMs: 26000, text: "En la práctica casi siempre conviene llegar a tercera forma normal." },
        ],
    },
    {
        id: TRANS(2),
        recordingId: REC(2),
        language: "es-MX",
        fullText:
            "Arrancamos con el avance. Ya quedó el CRUD con Prisma y las validaciones con zod. Falta el seed, la colección de Postman y las vistas. Yo me encargo del seed y las vistas. Perfecto, entonces la colección la cerramos el lunes.",
        segments: [
            { speaker: "Sebastián", startMs: 0, endMs: 7400, text: "Arrancamos con el avance. Ya quedó el CRUD con Prisma y las validaciones con zod." },
            { speaker: "Sebastián", startMs: 7400, endMs: 11000, text: "Falta el seed, la colección de Postman y las vistas." },
            { speaker: "Emilio", startMs: 11000, endMs: 13900, text: "Yo me encargo del seed y las vistas." },
            { speaker: "Sebastián", startMs: 13900, endMs: 17200, text: "Perfecto, entonces la colección la cerramos el lunes." },
        ],
    },
    {
        id: TRANS(3),
        recordingId: REC(3),
        language: "es-US",
        fullText:
            "¿Cómo tomas notas en tus clases? Normalmente en el celular, pero me pierdo cuando el profesor habla rápido. ¿Pagarías por una grabadora? No, preferiría algo que funcione en el navegador.",
        segments: [
            { speaker: "Entrevistador", startMs: 0, endMs: 3100, text: "¿Cómo tomas notas en tus clases?" },
            { speaker: "Entrevistada", startMs: 3100, endMs: 9800, text: "Normalmente en el celular, pero me pierdo cuando el profesor habla rápido." },
            { speaker: "Entrevistador", startMs: 9800, endMs: 12000, text: "¿Pagarías por una grabadora?" },
            { speaker: "Entrevistada", startMs: 12000, endMs: 16500, text: "No, preferiría algo que funcione en el navegador." },
        ],
    },
    {
        id: TRANS(4),
        recordingId: REC(4),
        language: "es-MX",
        fullText:
            "Un middleware recibe req, res y next. Si no responde, tiene que llamar a next. El manejador de errores lleva cuatro parámetros, si no Express no lo reconoce.",
        segments: [
            { speaker: "Profesor", startMs: 0, endMs: 6000, text: "Un middleware recibe req, res y next. Si no responde, tiene que llamar a next." },
            { speaker: "Profesor", startMs: 6000, endMs: 11500, text: "El manejador de errores lleva cuatro parámetros, si no Express no lo reconoce." },
        ],
    },
    {
        id: TRANS(5),
        recordingId: REC(5),
        language: "es-MX",
        fullText:
            "Revisé el capítulo dos y la metodología está bien, pero falta justificar el tamaño de la muestra. Para la próxima semana tráeme el marco teórico corregido. De acuerdo, también le mando el cronograma actualizado.",
        segments: [
            { speaker: "Asesor", startMs: 0, endMs: 8200, text: "Revisé el capítulo dos y la metodología está bien, pero falta justificar el tamaño de la muestra." },
            { speaker: "Asesor", startMs: 8200, endMs: 12600, text: "Para la próxima semana tráeme el marco teórico corregido." },
            { speaker: "Ana", startMs: 12600, endMs: 16000, text: "De acuerdo, también le mando el cronograma actualizado." },
        ],
    },
];

const summaries: Prisma.SummaryCreateManyInput[] = [
    { id: SUM(1), recordingId: REC(1), template: "CLASS", content: "Tema: normalización.\n- 1FN: valores atómicos en cada columna.\n- 2FN: sin dependencias parciales de la llave primaria.\n- Recomendación: llegar a 3FN en la práctica.\nPendiente: ejercicios de la página 120." },
    { id: SUM(2), recordingId: REC(2), template: "MEETING", content: "Acuerdos:\n- Emilio: seed y vistas.\n- Sebastián: colección de Postman.\nFecha límite: lunes.\nRiesgos: ninguno reportado." },
    { id: SUM(3), recordingId: REC(2), template: "CLASS", content: "Conceptos mencionados: CRUD con Prisma, validación con zod, datos de prueba (seed) y colecciones de peticiones." },
    { id: SUM(4), recordingId: REC(3), template: "INTERVIEW", content: "Perfil: estudiante universitaria.\nHallazgos:\n- Toma notas en el celular y se pierde con explicaciones rápidas.\n- No pagaría por hardware dedicado.\n- Prefiere una solución web." },
    { id: SUM(5), recordingId: REC(4), template: "CLASS", content: "Tema: middlewares en Express.\n- Firma (req, res, next).\n- Llamar a next() si no se responde.\n- El errorHandler necesita 4 parámetros." },
    { id: SUM(6), recordingId: REC(5), template: "MEETING", content: "Acuerdos con el asesor:\n- Justificar el tamaño de la muestra.\n- Entregar el marco teórico corregido la próxima semana.\n- Enviar el cronograma actualizado." },
];

async function main() {
    await prisma.$transaction([
        prisma.summary.deleteMany(),
        prisma.transcription.deleteMany(),
        prisma.recording.deleteMany(),
        prisma.user.deleteMany(),
        prisma.user.createMany({ data: users }),
        prisma.recording.createMany({ data: recordings }),
        prisma.transcription.createMany({ data: transcriptions }),
        prisma.summary.createMany({ data: summaries }),
    ]);

    console.log(
        `Seed listo: ${users.length} users, ${recordings.length} recordings, ` +
            `${transcriptions.length} transcriptions, ${summaries.length} summaries`,
    );
}

main()
    .catch((err) => {
        console.error("El seed falló:", err instanceof Error ? err.message : err);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
