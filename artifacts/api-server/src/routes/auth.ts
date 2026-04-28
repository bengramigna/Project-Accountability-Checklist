import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  SignUpBody,
  LogInBody,
  SignUpResponse,
  LogInResponse,
  LogOutResponse,
  GetCurrentUserResponse,
  AcceptCookiesResponse,
} from "@workspace/api-zod";
import {
  setSessionCookie,
  clearSessionCookie,
  readSession,
  requireAuth,
  getUserId,
  hashPassword,
  verifyPassword,
  genId,
} from "../lib/auth";

const router: IRouter = Router();

function toUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    email: u.email,
    cookiesAccepted: u.cookiesAccepted,
  };
}

router.get("/auth/me", async (req, res): Promise<void> => {
  const uid = readSession(req);
  if (!uid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
  if (!u) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json(GetCurrentUserResponse.parse(toUser(u)));
});

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, displayName, email, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const id = genId();
  const [u] = await db
    .insert(usersTable)
    .values({
      id,
      username,
      displayName,
      email,
      passwordHash: hashPassword(password),
      cookiesAccepted: false,
    })
    .returning();

  if (!u) {
    res.status(500).json({ error: "Failed to create user" });
    return;
  }

  setSessionCookie(res, u.id);
  res.json(SignUpResponse.parse(toUser(u)));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LogInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  const [u] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (!u || !verifyPassword(password, u.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  setSessionCookie(res, u.id);
  res.json(LogInResponse.parse(toUser(u)));
});

router.post("/auth/logout", (_req, res): void => {
  clearSessionCookie(res);
  res.json(LogOutResponse.parse({ ok: true }));
});

router.post(
  "/auth/accept-cookies",
  requireAuth,
  async (req, res): Promise<void> => {
    const uid = getUserId(req);
    const [u] = await db
      .update(usersTable)
      .set({ cookiesAccepted: true })
      .where(eq(usersTable.id, uid))
      .returning();
    if (!u) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(AcceptCookiesResponse.parse(toUser(u)));
  },
);

export default router;
