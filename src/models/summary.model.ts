// TODO Entrega 2: consultas con Prisma (lib/prisma.ts)

export type SummaryTemplate = "MEETING" | "CLASS" | "INTERVIEW";

export interface Summary {
  id: string;
  recordingId: string;
  template: SummaryTemplate;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSummaryInput {
  recordingId: string;
  template: SummaryTemplate;
  content: string;
}

export interface UpdateSummaryInput {
  template?: SummaryTemplate;
  content?: string;
}

export const dummySummaries: Summary[] = [
  {
    id: "d1b2c3d4-0000-4000-8000-000000000001",
    recordingId: "b1b2c3d4-0000-4000-8000-000000000001",
    template: "CLASS",
    content:
      "Tema: normalización de bases de datos. Se explicó la primera forma normal y se dejó ejercicio de tarea.",
    createdAt: "2026-09-15T10:10:00.000Z",
    updatedAt: "2026-09-15T10:10:00.000Z",
  },
  {
    id: "d1b2c3d4-0000-4000-8000-000000000002",
    recordingId: "b1b2c3d4-0000-4000-8000-000000000002",
    template: "MEETING",
    content:
      "Acuerdos: el módulo de rutas está terminado. Pendiente: controladores y conexión a la base de datos.",
    createdAt: "2026-09-20T16:45:00.000Z",
    updatedAt: "2026-09-20T16:45:00.000Z",
  },
];
