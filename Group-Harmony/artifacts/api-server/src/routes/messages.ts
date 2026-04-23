import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, messagesTable, usersTable, activityTable } from "@workspace/db";
import {
  ListMessagesParams,
  ListMessagesResponse,
  SendMessageParams,
  SendMessageBody,
  SendMessageResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId, genId } from "../lib/auth";
import { isMember } from "../lib/projectAccess";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/messages",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListMessagesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    if (!(await isMember(params.data.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const rows = await db
      .select({
        id: messagesTable.id,
        projectId: messagesTable.projectId,
        authorId: messagesTable.authorId,
        body: messagesTable.body,
        createdAt: messagesTable.createdAt,
        authorName: usersTable.displayName,
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(usersTable.id, messagesTable.authorId))
      .where(eq(messagesTable.projectId, params.data.projectId))
      .orderBy(messagesTable.createdAt);
    res.json(
      ListMessagesResponse.parse(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.post(
  "/projects/:projectId/messages",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = SendMessageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = SendMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const uid = getUserId(req);
    if (!(await isMember(params.data.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const id = genId();
    const [m] = await db
      .insert(messagesTable)
      .values({
        id,
        projectId: params.data.projectId,
        authorId: uid,
        body: parsed.data.body,
      })
      .returning();
    if (!m) {
      res.status(500).json({ error: "Failed" });
      return;
    }
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
    await db.insert(activityTable).values({
      id: genId(),
      projectId: params.data.projectId,
      actorId: uid,
      kind: "message_sent",
      summary: `sent a message`,
    });
    res.json(
      SendMessageResponse.parse({
        id: m.id,
        projectId: m.projectId,
        authorId: m.authorId,
        authorName: u?.displayName ?? "",
        body: m.body,
        createdAt: m.createdAt.toISOString(),
      }),
    );
  },
);

export default router;
