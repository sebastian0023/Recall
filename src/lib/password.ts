import bcrypt from "bcryptjs";

const ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// Hash de relleno: si el correo no existe se compara contra este para que la respuesta
// tarde lo mismo y no revele qué correos están registrados
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", ROUNDS);
