import type { Request, Response } from "express";
import type { CreateUserInput } from "../models/user.model.js";
import { dummyUsers } from "../models/user.model.js";

export function register(req: Request, res: Response) {
  const { email, name } = (req.body ?? {}) as Partial<CreateUserInput>;
  const user = {
    ...dummyUsers[0],
    id: crypto.randomUUID(),
    email: email ?? dummyUsers[0].email,
    name: name ?? dummyUsers[0].name,
  };

  res.status(201).json({ data: user, message: "User registered (dummy)" });
}

export function login(req: Request, res: Response) {
  const { email } = (req.body ?? {}) as { email?: string };
  const user = { ...dummyUsers[0], email: email ?? dummyUsers[0].email };

  res.json({
    data: { token: "dummy-jwt-token", user },
    message: "Login successful (dummy)",
  });
}

export function me(_req: Request, res: Response) {
  res.json({ data: res.locals.user, message: "Current user (dummy)" });
}
