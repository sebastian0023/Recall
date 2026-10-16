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
}
 
export interface UpdateSummaryInput {
    content?: string;
}

export const dummySummaries: Summary[] = [
    {
        id: "d4e5f6a7-3b5c-4e2d-9a4f-3c4d5e6f7a01",
        recordingId: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e01",
        template: "CLASS",
        content:
            "Tema: Autenticacion",
        createdAt: new Date("2026-10-10T10:30:00Z"),
        updatedAt: new Date("2026-10-10T10:30:00Z")
    },
    {
        id: "d4e5f6a7-3b5c-4e2d-9a4f-3c4d5e6f7a02",
        recordingId: "b7e4c2a1-1f3d-4c9a-9e2b-1a2b3c4d5e01",
        template: "MEETING",
        content:
            "Acuerdos: Definir alcance de proyecto",
        createdAt: new Date("2026-10-10T10:35:00Z"),
        updatedAt: new Date("2026-10-10T10:35:00Z")
    }
];
