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
    language?: string;
    fullText: string;
    segments?: TranscriptSegment[];
}

export interface UpdateTranscriptionInput {
    language?: string;
    fullText?: string;
    segments?: TranscriptSegment[];
}
