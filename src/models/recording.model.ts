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
    userId?: string;
    title: string;
    s3Key: string;
    durationSec?: number | null;
}

export interface UpdateRecordInput {
    title?: string;
    s3Key?: string;
    durationSec?: number | null;
    status?: RecordingStatus;
    errorMessage?: string | null;
}
