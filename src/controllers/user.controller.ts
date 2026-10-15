import type { Request, Response } from "express";
import { dummyUsers } from "../models/user.model.js";

export function getUsers(_req: Request, res: Response) {
  res.json({ data: dummyUsers, message: "Users list (dummy)" });
}

export function getUserById(req: Request, res: Response) {
  const user = { ...dummyUsers[0], id: req.params.id };

  res.json({ data: user, message: "User detail (dummy)" });
}

export function updateUser(req: Request, res: Response) {
  const user = { ...dummyUsers[0], ...req.body, id: req.params.id };

  res.json({ data: user, message: "User updated (dummy)" });
}

export function deleteUser(_req: Request, res: Response) {
  res.status(204).send();
}
