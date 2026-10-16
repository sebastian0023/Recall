// model User {
//   id           String   @id @default(uuid()) @db.Uuid
//   email        String   @unique
//   passwordHash String
//   name         String
//   createdAt    DateTime @default(now())
//   updatedAt    DateTime @updatedAt

//   recordings Recording[]
// }

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
}

export const dummyUsers: User[] = [
    {
        id: "a1b2c3d4-0000-4000-8000-000000000001",
        email: "sebastian@recall.app",
        passwordHash: "hash-dummy1",
        name: "Sebastian",
        createdAt: new Date("2026-10-01T09:00:00Z"),
        updatedAt: new Date("2026-10-01T09:00:00Z")
    },
    {
        id: "a1b2c3d4-0000-4000-8000-000000000002",
        email: "emilio@recall.app",
        passwordHash: "hash-dummy2",
        name: "Emilio emilio",
        createdAt: new Date("2026-10-02T14:30:00Z"),
        updatedAt: new Date("2026-10-02T14:30:00Z")
    }
]

export function toPublicUser(user: User): PublicUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
}

