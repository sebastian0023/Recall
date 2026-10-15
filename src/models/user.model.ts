// TODO Entrega 2: consultas con Prisma (lib/prisma.ts)

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}

export const dummyUsers: User[] = [
  {
    id: "a1b2c3d4-0000-4000-8000-000000000001",
    email: "ana@recall.app",
    name: "Ana García",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "a1b2c3d4-0000-4000-8000-000000000002",
    email: "luis@recall.app",
    name: "Luis Hernández",
    createdAt: "2026-09-03T15:30:00.000Z",
    updatedAt: "2026-09-03T15:30:00.000Z",
  },
  {
    id: "a1b2c3d4-0000-4000-8000-000000000003",
    email: "marta@recall.app",
    name: "Marta Ramírez",
    createdAt: "2026-09-10T08:15:00.000Z",
    updatedAt: "2026-09-10T08:15:00.000Z",
  },
];
