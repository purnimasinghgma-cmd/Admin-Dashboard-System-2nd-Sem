import { Router } from "express";
import { query } from "../db.js";

export const authRouter = Router();

const DEMO_PROFILES = {
  admin: {
    id: 1,
    name: "Avery Chen",
    email: "avery.chen@nexusops.io",
    role: "admin",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Avery&backgroundColor=transparent",
  },
  manager: {
    id: 2,
    name: "Jordan Patel",
    email: "jordan.patel@nexusops.io",
    role: "manager",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=transparent",
  },
  user: {
    id: 3,
    name: "Sam Rivera",
    email: "sam.rivera@nexusops.io",
    role: "user",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=transparent",
  },
};

async function getActiveRole() {
  const r = await query(
    `SELECT role FROM session WHERE id = 'default' LIMIT 1`,
  );
  return r.rows[0]?.role || "admin";
}

authRouter.get("/me", async (_req, res, next) => {
  try {
    const role = await getActiveRole();
    res.json(DEMO_PROFILES[role] || DEMO_PROFILES.admin);
  } catch (e) {
    next(e);
  }
});

authRouter.post("/switch-role", async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!["admin", "manager", "user"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    await query(
      `INSERT INTO session (id, role, updated_at)
       VALUES ('default', $1, now())
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, updated_at = now()`,
      [role],
    );
    res.json(DEMO_PROFILES[role]);
  } catch (e) {
    next(e);
  }
});
