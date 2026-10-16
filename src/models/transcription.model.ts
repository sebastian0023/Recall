// model Transcription {
//   id          String   @id @default(uuid()) @db.Uuid
//   recordingId String   @unique @db.Uuid
//   language    String   @default("es-US")
//   fullText    String
//   segments    Json? // [{ speaker, startMs, endMs, text }]
//   createdAt   DateTime @default(now())
//   updatedAt   DateTime @updatedAt

//   recording Recording @relation(fields: [recordingId], references: [id], onDelete: Cascade)
// }

export interface TranscriptSegment {
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
    segments: TranscriptSegment[] | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTranscriptionInput {
    recordingId: string;
    fullText: string;
    segments?: TranscriptSegment[];
}

export interface UpdateTranscriptionInput {
    fullText?: string;
    segments?: TranscriptSegment[];
}

export const dummyTranscription: Transcription[] = [
    {
        id: "c3d9e8f2-2a4b-4d1c-8f3e-2b3c4d5e6f01",
        recordingId: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e01",
        language: "es-US",
        fullText:
        "Hoy vamos a ver autenticacion empezando con la teoria, como funciona y porque es imporante para nuestra aplicacion",
        segments: [
        {
            speaker: "spk_0",
            startMs: 0,
            endMs: 4200,
            text: "Como funciona.",
        },
        {
            speaker: "spk_1",
            startMs: 4200,
            endMs: 7100,
            text: "Porque es importante?",
        },
        ],
        createdAt: new Date("2026-10-10T10:20:00Z"),
        updatedAt: new Date("2026-10-10T10:20:00Z")
}
]; 
