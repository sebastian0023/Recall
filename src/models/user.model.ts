export type UserRole = "USER" | "ADMIN";

export interface User {
    id: string;
    passwordHash?: string | null;
    email: string;
    name: string;
    role: UserRole;
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
    role?: UserRole;
}

// Segunda capa de protección: nunca se expone passwordHash, aunque el objeto lo trajera
export function toPublicUser<T extends object>(user: T): Omit<T, "passwordHash"> {
    const { passwordHash: _passwordHash, ...publicUser } = user as T & { passwordHash?: unknown };
    return publicUser;
}

