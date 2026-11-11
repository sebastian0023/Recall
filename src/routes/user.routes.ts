import { Router } from "express";
import { deleteUser, getUserById, getUsers, updateUser } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole, requireSelfOrAdmin } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { idParams } from "../schemas/common.schema.js";
import { updateUserBody } from "../schemas/user.schema.js";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     operationId: listUsers
 *     summary: "Lista los usuarios"
 *     description: |
 *       Solo `ADMIN` (un `USER` recibe 403). Cada usuario incluye cuántas grabaciones tiene en `_count.recordings`.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: "Lista de usuarios, del más reciente al más antiguo (`message: Users list`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UserListEnvelope" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 */
router.get("/", requireRole("ADMIN"), getUsers);
/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     operationId: getUser
 *     summary: "Obtiene un usuario con sus grabaciones"
 *     description: |
 *       Solo el propio usuario o un `ADMIN`. Si el id es de otro usuario, un `USER` recibe 403 (sin revelar si existe); el 404 solo lo ve un `ADMIN`.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       200:
 *         description: "Usuario con sus grabaciones (`message: User found`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UserDetailEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 */
router.get("/:id", validate({ params: idParams }), requireSelfOrAdmin, getUserById);
/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags: [Users]
 *     operationId: updateUser
 *     summary: "Actualiza un usuario"
 *     description: |
 *       El propio usuario o un `ADMIN` pueden cambiar `name` y `email`. **Solo un `ADMIN` puede enviar `role`**; si un `USER` lo envía recibe 403. Se necesita al menos un campo.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: "#/components/schemas/UpdateUserInput" }
 *     responses:
 *       200:
 *         description: "Usuario actualizado (`message: User updated`)"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/UserEnvelope" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 *       409:
 *         description: "El correo ya está registrado por otro usuario"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *             example: { error: { message: "Resource already exists", requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 */
router.patch("/:id", validate({ params: idParams, body: updateUserBody }), requireSelfOrAdmin, updateUser);
/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     operationId: deleteUser
 *     summary: "Elimina un usuario"
 *     description: |
 *       Solo `ADMIN`. Un usuario con grabaciones **no se elimina** (409): primero hay que borrar sus grabaciones.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: "#/components/parameters/IdPath"
 *     responses:
 *       204: { $ref: "#/components/responses/NoContent" }
 *       400: { $ref: "#/components/responses/BadRequest" }
 *       401: { $ref: "#/components/responses/Unauthorized" }
 *       403: { $ref: "#/components/responses/Forbidden" }
 *       404: { $ref: "#/components/responses/NotFound" }
 *       409:
 *         description: "El usuario todavía tiene grabaciones"
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/Error" }
 *             example: { error: { message: "User has recordings; delete them first", requestId: 3b9ca8e6-9c30-46e5-a12c-a4ebddb0e9d3 } }
 */
router.delete("/:id", validate({ params: idParams }), requireRole("ADMIN"), deleteUser);

export default router;
