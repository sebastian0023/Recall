// TODO Entrega 2: consultas con Prisma (lib/prisma.ts)

export interface TranscriptionSegment {
  speaker: string;
  startMs: number;
  endMs: number;
  text: string;
}

export interface Transcription {
  id: string;
  recordingId: string;
  language: string;
  fullText: string;
  segments: TranscriptionSegment[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTranscriptionInput {
  recordingId: string;
  language?: string;
  fullText: string;
  segments?: TranscriptionSegment[];
}

export interface UpdateTranscriptionInput {
  language?: string;
  fullText?: string;
  segments?: TranscriptionSegment[];
}

export const dummyTranscriptions: Transcription[] = [
  {
    id: "c1b2c3d4-0000-4000-8000-000000000001",
    recordingId: "b1b2c3d4-0000-4000-8000-000000000001",
    language: "es-US",
    fullText:
      "Hoy vamos a revisar la normalización de bases de datos. Empecemos con la primera forma normal.",
    segments: [
      {
        speaker: "spk_0",
        startMs: 0,
        endMs: 4200,
        text: "Hoy vamos a revisar la normalización de bases de datos.",
      },
      {
        speaker: "spk_0",
        startMs: 4200,
        endMs: 8000,
        text: "Empecemos con la primera forma normal.",
      },
    ],
    createdAt: "2026-09-15T10:05:00.000Z",
    updatedAt: "2026-09-15T10:05:00.000Z",
  },
  {
    id: "c1b2c3d4-0000-4000-8000-000000000002",
    recordingId: "b1b2c3d4-0000-4000-8000-000000000002",
    language: "es-US",
    fullText:
      "Buenos días a todos. Revisemos los avances de la semana. Ya terminamos el módulo de rutas.",
    segments: [
      {
        speaker: "spk_0",
        startMs: 0,
        endMs: 3000,
        text: "Buenos días a todos. Revisemos los avances de la semana.",
      },
      {
        speaker: "spk_1",
        startMs: 3000,
        endMs: 6500,
        text: "Ya terminamos el módulo de rutas.",
      },
    ],
    createdAt: "2026-09-20T16:40:00.000Z",
    updatedAt: "2026-09-20T16:40:00.000Z",
  },
];
