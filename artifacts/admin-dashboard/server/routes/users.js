import { Router } from "express";
import { query } from "../db.js";

export const usersRouter = Router();

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
  };
}

usersRouter.get("/", async (req, res, next) => {
  try {
    const { role, status, q } = req.query;
    const conds = [];
    const params = [];
    if (role) {
      params.push(role);
      conds.push(`role = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conds.push(`status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      conds.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const r = await query(
      `SELECT * FROM users ${where} ORDER BY created_at DESC`,
      params,
    );
    res.json(r.rows.map(mapUser));
  } catch (e) {
    next(e);
  }
});

usersRouter.post("/", async (req, res, next) => {
  try {
    const { name, email, role, status, avatarUrl } = req.body;
    const r = await query(
      `INSERT INTO users (name, email, role, status, avatar_url, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *`,
      [name, email, role || "user", status || "active", avatarUrl || null],
    );
    res.status(201).json(mapUser(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, email, role, status, avatarUrl } = req.body;
    const r = await query(
      `UPDATE users SET
         name = COALESCE($2, name),
         email = COALESCE($3, email),
         role = COALESCE($4, role),
         status = COALESCE($5, status),
         avatar_url = COALESCE($6, avatar_url)
       WHERE id = $1
       RETURNING *`,
      [id, name, email, role, status, avatarUrl],
    );
    if (!r.rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(mapUser(r.rows[0]));
  } catch (e) {
    next(e);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await query(`DELETE FROM users WHERE id = $1`, [id]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
