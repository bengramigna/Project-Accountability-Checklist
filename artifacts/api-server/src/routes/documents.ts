import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, documentsTable, usersTable, activityTable } from "@workspace/db";
import {
  ListDocumentsParams,
  ListDocumentsResponse,
  CreateDocumentParams,
  CreateDocumentBody,
  CreateDocumentResponse,
  DeleteDocumentParams,
  DeleteDocumentResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId, genId } from "../lib/auth";
import { isMember } from "../lib/projectAccess";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/documents",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListDocumentsParams.safeParse(req.params);
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
        id: documentsTable.id,
        projectId: documentsTable.projectId,
        filename: documentsTable.filename,
        sizeBytes: documentsTable.sizeBytes,
        uploadedById: documentsTable.uploadedById,
        createdAt: documentsTable.createdAt,
        uploadedByName: usersTable.displayName,
      })
      .from(documentsTable)
      .innerJoin(usersTable, eq(usersTable.id, documentsTable.uploadedById))
      .where(eq(documentsTable.projectId, params.data.projectId))
      .orderBy(desc(documentsTable.createdAt));
    res.json(
      ListDocumentsResponse.parse(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.post(
  "/projects/:projectId/documents",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateDocumentBody.safeParse(req.body);
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
    const [d] = await db
      .insert(documentsTable)
      .values({
        id,
        projectId: params.data.projectId,
        uploadedById: uid,
        filename: parsed.data.filename,
        sizeBytes: parsed.data.sizeBytes,
      })
      .returning();
    if (!d) {
      res.status(500).json({ error: "Failed" });
      return;
    }
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, uid));
    await db.insert(activityTable).values({
      id: genId(),
      projectId: params.data.projectId,
      actorId: uid,
      kind: "document_added",
      summary: `uploaded ${d.filename}`,
    });
    res.json(
      CreateDocumentResponse.parse({
        id: d.id,
        projectId: d.projectId,
        filename: d.filename,
        sizeBytes: d.sizeBytes,
        uploadedById: d.uploadedById,
        uploadedByName: u?.displayName ?? "",
        createdAt: d.createdAt.toISOString(),
      }),
    );
  },
);

router.delete(
  "/documents/:documentId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    const [d] = await db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, params.data.documentId));
    if (!d) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!(await isMember(d.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await db
      .delete(documentsTable)
      .where(eq(documentsTable.id, params.data.documentId));
    res.json(DeleteDocumentResponse.parse({ ok: true }));
  },
);

export default router;
