// model User {
//   id         String   @id @default(uuid()) @db.Uuid
//   cognitoSub String   @unique
//   email      String   @unique
//   name       String
//   createdAt  DateTime @default(now())
//   updatedAt  DateTime @updatedAt

//   recordings Recording[]
// }

export interface User {
    id: string;
    cognitoSub: string;
    email: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PublicUser = Omit<User, "cognitoSub">;

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

export interface ConfirmInput {
    email: string;
    code: string;
}

export function toPublicUser(user: User): PublicUser {
    const { cognitoSub, ...publicUser } = user;
    return publicUser;
}

