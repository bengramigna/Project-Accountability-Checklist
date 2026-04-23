import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, notesTable, usersTable, activityTable } from "@workspace/db";
import {
  ListNotesParams,
  ListNotesResponse,
  CreateNoteParams,
  CreateNoteBody,
  CreateNoteResponse,
  DeleteNoteParams,
  DeleteNoteResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId, genId } from "../lib/auth";
import { isMember } from "../lib/projectAccess";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/notes",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListNotesParams.safeParse(req.params);
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
        id: notesTable.id,
        projectId: notesTable.projectId,
        authorId: notesTable.authorId,
        body: notesTable.body,
        createdAt: notesTable.createdAt,
        authorName: usersTable.displayName,
      })
      .from(notesTable)
      .innerJoin(usersTable, eq(usersTable.id, notesTable.authorId))
      .where(eq(notesTable.projectId, params.data.projectId))
      .orderBy(desc(notesTable.createdAt));
    res.json(
      ListNotesResponse.parse(
        rows.map((r) => ({
          id: r.id,
          projectId: r.projectId,
          authorId: r.authorId,
          authorName: r.authorName,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.post(
  "/projects/:projectId/notes",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateNoteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateNoteBody.safeParse(req.body);
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
    const [n] = await db
      .insert(notesTable)
      .values({
        id,
        projectId: params.data.projectId,
        authorId: uid,
        body: parsed.data.body,
      })
      .returning();
    if (!n) {
      res.status(500).json({ error: "Failed" });
      return;
    }
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
    await db.insert(activityTable).values({
      id: genId(),
      projectId: params.data.projectId,
      actorId: uid,
      kind: "note_added",
      summary: `posted a note`,
    });
    res.json(
      CreateNoteResponse.parse({
        id: n.id,
        projectId: n.projectId,
        authorId: n.authorId,
        authorName: u?.displayName ?? "",
        body: n.body,
        createdAt: n.createdAt.toISOString(),
      }),
    );
  },
);

router.delete(
  "/notes/:noteId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteNoteParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    const [n] = await db
      .select()
      .from(notesTable)
      .where(eq(notesTable.id, params.data.noteId));
    if (!n) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (n.authorId !== uid) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(notesTable).where(eq(notesTable.id, params.data.noteId));
    res.json(DeleteNoteResponse.parse({ ok: true }));
  },
);

export default router;
