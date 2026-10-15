// TODO Entrega 2: consultas con Prisma (lib/prisma.ts)

export type RecordingStatus = "UPLOADED" | "PROCESSING" | "DONE" | "FAILED";

export interface Recording {
  id: string;
  userId: string;
  title: string;
  s3Key: string;
  durationSec: number | null;
  status: RecordingStatus;
  transcribeJobId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordingInput {
  title: string;
  s3Key: string;
  durationSec?: number;
}

export interface UpdateRecordingInput {
  title?: string;
  durationSec?: number;
  status?: RecordingStatus;
  errorMessage?: string;
}

export const dummyRecordings: Recording[] = [
  {
    id: "b1b2c3d4-0000-4000-8000-000000000001",
    userId: "a1b2c3d4-0000-4000-8000-000000000001",
    title: "Clase de Bases de Datos",
    s3Key: "audio/ana/clase-bases-de-datos.mp3",
    durationSec: 3600,
    status: "DONE",
    transcribeJobId: "recall-job-0001",
    errorMessage: null,
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-09-15T10:10:00.000Z",
  },
  {
    id: "b1b2c3d4-0000-4000-8000-000000000002",
    userId: "a1b2c3d4-0000-4000-8000-000000000001",
    title: "Reunión de seguimiento del proyecto",
    s3Key: "audio/ana/reunion-seguimiento.mp3",
    durationSec: 1800,
    status: "PROCESSING",
    transcribeJobId: "recall-job-0002",
    errorMessage: null,
    createdAt: "2026-09-20T16:00:00.000Z",
    updatedAt: "2026-09-20T16:05:00.000Z",
  },
  {
    id: "b1b2c3d4-0000-4000-8000-000000000003",
    userId: "a1b2c3d4-0000-4000-8000-000000000002",
    title: "Entrevista para vacante de desarrollador",
    s3Key: "audio/luis/entrevista-desarrollador.mp3",
    durationSec: 2400,
    status: "UPLOADED",
    transcribeJobId: null,
    errorMessage: null,
    createdAt: "2026-09-22T11:30:00.000Z",
    updatedAt: "2026-09-22T11:30:00.000Z",
  },
];
