import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tasksTable, activityTable, usersTable } from "@workspace/db";
import {
  ListTasksParams,
  ListTasksResponse,
  CreateTaskParams,
  CreateTaskBody,
  CreateTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  DeleteTaskResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId, genId } from "../lib/auth";
import { isMember } from "../lib/projectAccess";

const router: IRouter = Router();

function toTaskDto(t: typeof tasksTable.$inferSelect) {
  return {
    id: t.id,
    projectId: t.projectId,
    title: t.title,
    description: t.description ?? null,
    assigneeId: t.assigneeId ?? null,
    deadline: t.deadline?.toISOString() ?? null,
    completed: t.completed,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get(
  "/projects/:projectId/tasks",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListTasksParams.safeParse(req.params);
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
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, params.data.projectId))
      .orderBy(tasksTable.createdAt);
    res.json(ListTasksResponse.parse(rows.map(toTaskDto)));
  },
);

router.post(
  "/projects/:projectId/tasks",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateTaskBody.safeParse(req.body);
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
    const [t] = await db
      .insert(tasksTable)
      .values({
        id,
        projectId: params.data.projectId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        assigneeId: parsed.data.assigneeId ?? null,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      })
      .returning();
    if (!t) {
      res.status(500).json({ error: "Failed" });
      return;
    }
    await db.insert(activityTable).values({
      id: genId(),
      projectId: params.data.projectId,
      actorId: uid,
      kind: "task_created",
      summary: `added task "${t.title}"`,
    });
    res.json(CreateTaskResponse.parse(toTaskDto(t)));
  },
);

router.patch("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const uid = getUserId(req);
  const [existing] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.taskId));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!(await isMember(existing.projectId, uid))) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const updates: Partial<typeof tasksTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined)
    updates.description = parsed.data.description ?? null;
  if (parsed.data.assigneeId !== undefined)
    updates.assigneeId = parsed.data.assigneeId ?? null;
  if (parsed.data.deadline !== undefined)
    updates.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;
  if (parsed.data.completed !== undefined)
    updates.completed = parsed.data.completed;

  const [t] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, params.data.taskId))
    .returning();
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (parsed.data.completed === true && !existing.completed) {
    const [actor] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, uid));
    await db.insert(activityTable).values({
      id: genId(),
      projectId: existing.projectId,
      actorId: uid,
      kind: "task_completed",
      summary: `${actor?.displayName ?? "Someone"} finished "${t.title}"`,
    });
  }

  res.json(UpdateTaskResponse.parse(toTaskDto(t)));
});

router.delete("/tasks/:taskId", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const uid = getUserId(req);
  const [t] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, params.data.taskId));
  if (!t) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!(await isMember(t.projectId, uid))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(tasksTable).where(eq(tasksTable.id, params.data.taskId));
  res.json(DeleteTaskResponse.parse({ ok: true }));
});

export default router;
