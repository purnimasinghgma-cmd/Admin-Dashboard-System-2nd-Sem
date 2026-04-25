import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sessionTable } from "@workspace/db";
import {
  GetCurrentUserResponse,
  SwitchRoleBody,
  SwitchRoleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const SINGLE_SESSION_ID = "default";

const DEMO_PROFILES: Record<
  string,
  { id: number; name: string; email: string; avatarUrl: string }
> = {
  admin: {
    id: 1,
    name: "Avery Chen",
    email: "avery.chen@northbeam.io",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Avery&backgroundColor=transparent",
  },
  manager: {
    id: 2,
    name: "Jordan Patel",
    email: "jordan.patel@northbeam.io",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Jordan&backgroundColor=transparent",
  },
  user: {
    id: 3,
    name: "Sam Rivera",
    email: "sam.rivera@northbeam.io",
    avatarUrl:
      "https://api.dicebear.com/9.x/notionists/svg?seed=Sam&backgroundColor=transparent",
  },
};

async function getCurrentRole(): Promise<"admin" | "manager" | "user"> {
  const [row] = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.id, SINGLE_SESSION_ID));

  if (!row) {
    await db
      .insert(sessionTable)
      .values({ id: SINGLE_SESSION_ID, role: "admin" })
      .onConflictDoNothing();
    return "admin";
  }

  const role = row.role as "admin" | "manager" | "user";
  return role;
}

async function setCurrentRole(
  role: "admin" | "manager" | "user",
): Promise<void> {
  await db
    .insert(sessionTable)
    .values({ id: SINGLE_SESSION_ID, role, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sessionTable.id,
      set: { role, updatedAt: new Date() },
    });
}

router.get("/auth/me", async (_req, res): Promise<void> => {
  const role = await getCurrentRole();
  const profile = DEMO_PROFILES[role]!;
  res.json(
    GetCurrentUserResponse.parse({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role,
      avatarUrl: profile.avatarUrl,
    }),
  );
});

router.post("/auth/switch-role", async (req, res): Promise<void> => {
  const parsed = SwitchRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await setCurrentRole(parsed.data.role);
  const profile = DEMO_PROFILES[parsed.data.role]!;
  res.json(
    SwitchRoleResponse.parse({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: parsed.data.role,
      avatarUrl: profile.avatarUrl,
    }),
  );
});

export default router;
