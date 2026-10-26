// model Summary {
//   id          String          @id @default(uuid()) @db.Uuid
//   recordingId String          @db.Uuid
//   template    SummaryTemplate
//   content     String
//   createdAt   DateTime        @default(now())
//   updatedAt   DateTime        @updatedAt

//   recording Recording @relation(fields: [recordingId], references: [id], onDelete: Cascade)

//   @@index([recordingId])
// }

export type SummaryTemplate = "MEETING" | "CLASS" | "INTERVIEW";

export interface Summary {
    id: string;
    recordingId: string;
    template: SummaryTemplate;
    content: string;
    createdAt: Date;
    updatedAt: Date;
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
