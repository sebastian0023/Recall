// model Recording {
//   id              String          @id @default(uuid()) @db.Uuid
//   userId          String          @db.Uuid
//   title           String
//   s3Key           String
//   durationSec     Int?
//   status          RecordingStatus @default(UPLOADED)
//   transcribeJobId String?
//   errorMessage    String?
//   createdAt       DateTime        @default(now())
//   updatedAt       DateTime        @updatedAt

//   user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
//   transcription Transcription?
//   summaries     Summary[]
export type RecordingStatus = "UPLOADED" | "PROCESSING" | "DONE" | "FAILED"

export interface Recording {
    id: string;
    userId:string;
    title:string;
    s3Key:string;
    durationSec: number | null
    status: RecordingStatus
    transcribeJobId: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRecordInput {
    s3Key: string | null;
    title: string | null;
}

export interface UpdateRecordInput {
    title: string | null;
}

export const dummyRecordings: Recording[] = [
    {
        id: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e01",
        userId: "a1b2c3d4-0000-4000-8000-000000000001",
        title: "Clase de Backend",
        s3Key: "audios/clase-b.mp3",
        durationSec: 3600,
        status: "DONE",
        transcribeJobId: "job-001",
        errorMessage: null,
        createdAt: new Date("2026-10-10T10:00:00Z"),
        updatedAt: new Date("2026-10-10T10:30:00Z")
    },
    {
        id: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e02",
        userId: "a1b2c3d4-0000-4000-8000-000000000001",
        title: "Reunión de proyecto",
        s3Key: "audios/reunion-proyecto.m4a",
        durationSec: null,
        status: "UPLOADED",
        transcribeJobId: null,
        errorMessage: null,
        createdAt: new Date("2026-10-12T16:00:00Z"),
        updatedAt: new Date("2026-10-12T16:00:00Z")
    },
    {
        id: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e03",
        userId: "a1b2c3d4-0000-4000-8000-000000000002",
        title: "Reunion con el profe",
        s3Key: "audios/reunion-profe.wav",
        durationSec: 1500,
        status: "PROCESSING",
        transcribeJobId: "job-002",
        errorMessage: null,
        createdAt: new Date("2026-10-14T11:00:00Z"),
        updatedAt: new Date("2026-10-14T11:05:00Z")
    },
];
