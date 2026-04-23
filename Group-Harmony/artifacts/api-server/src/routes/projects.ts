import { Router, type IRouter } from "express";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import {
  db,
  projectsTable,
  projectMembersTable,
  tasksTable,
  usersTable,
  activityTable,
} from "@workspace/db";
import {
  ListProjectsResponse,
  CreateProjectBody,
  CreateProjectResponse,
  GetProjectParams,
  GetProjectResponse,
  UpdateProjectParams,
  UpdateProjectBody,
  UpdateProjectResponse,
  DeleteProjectParams,
  DeleteProjectResponse,
  ListProjectMembersParams,
  ListProjectMembersResponse,
  InviteToProjectParams,
  InviteToProjectBody,
  InviteToProjectResponse,
  GetProjectStatsParams,
  GetProjectStatsResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId, genId } from "../lib/auth";
import { isMember } from "../lib/projectAccess";

const router: IRouter = Router();

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const uid = getUserId(req);
  const memberships = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, uid));
  const projectIds = memberships.map((m) => m.projectId);

  if (projectIds.length === 0) {
    res.json(ListProjectsResponse.parse([]));
    return;
  }

  const projects = await db
    .select()
    .from(projectsTable)
    .where(inArray(projectsTable.id, projectIds));

  const memberCounts = await db
    .select({
      projectId: projectMembersTable.projectId,
      c: count(projectMembersTable.userId),
    })
    .from(projectMembersTable)
    .where(inArray(projectMembersTable.projectId, projectIds))
    .groupBy(projectMembersTable.projectId);

  const taskCounts = await db
    .select({
      projectId: tasksTable.projectId,
      total: count(tasksTable.id),
      done: sql<number>`SUM(CASE WHEN ${tasksTable.completed} THEN 1 ELSE 0 END)`,
    })
    .from(tasksTable)
    .where(inArray(tasksTable.projectId, projectIds))
    .groupBy(tasksTable.projectId);

  const memberMap = new Map(memberCounts.map((m) => [m.projectId, m.c]));
  const taskMap = new Map(
    taskCounts.map((t) => [t.projectId, { total: t.total, done: Number(t.done ?? 0) }]),
  );

  const summaries = projects.map((p) => ({
    id: p.id,
    name: p.name,
    deadline: p.deadline?.toISOString() ?? null,
    memberCount: memberMap.get(p.id) ?? 0,
    taskCount: taskMap.get(p.id)?.total ?? 0,
    completedTaskCount: taskMap.get(p.id)?.done ?? 0,
    ownerId: p.ownerId,
    createdAt: p.createdAt.toISOString(),
  }));

  summaries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(ListProjectsResponse.parse(summaries));
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const uid = getUserId(req);
  const id = genId();
  const [p] = await db
    .insert(projectsTable)
    .values({ id, name: parsed.data.name, ownerId: uid })
    .returning();
  if (!p) {
    res.status(500).json({ error: "Failed to create project" });
    return;
  }

  const memberSet = new Set([uid, ...parsed.data.memberIds]);
  await db
    .insert(projectMembersTable)
    .values([...memberSet].map((userId) => ({ projectId: id, userId })))
    .onConflictDoNothing();

  await db.insert(activityTable).values({
    id: genId(),
    projectId: id,
    actorId: uid,
    kind: "project_created",
    summary: `created project "${p.name}"`,
  });

  res.json(
    CreateProjectResponse.parse({
      id: p.id,
      name: p.name,
      deadline: p.deadline?.toISOString() ?? null,
      ownerId: p.ownerId,
      createdAt: p.createdAt.toISOString(),
    }),
  );
});

router.get(
  "/projects/:projectId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    if (!(await isMember(params.data.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [p] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, params.data.projectId));
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(
      GetProjectResponse.parse({
        id: p.id,
        name: p.name,
        deadline: p.deadline?.toISOString() ?? null,
        ownerId: p.ownerId,
        createdAt: p.createdAt.toISOString(),
      }),
    );
  },
);

router.patch(
  "/projects/:projectId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const uid = getUserId(req);
    if (!(await isMember(params.data.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const updates: Partial<typeof projectsTable.$inferInsert> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.deadline !== undefined)
      updates.deadline = parsed.data.deadline ? new Date(parsed.data.deadline) : null;

    const [p] = await db
      .update(projectsTable)
      .set(updates)
      .where(eq(projectsTable.id, params.data.projectId))
      .returning();
    if (!p) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(
      UpdateProjectResponse.parse({
        id: p.id,
        name: p.name,
        deadline: p.deadline?.toISOString() ?? null,
        ownerId: p.ownerId,
        createdAt: p.createdAt.toISOString(),
      }),
    );
  },
);

router.delete(
  "/projects/:projectId",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    const [p] = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.id, params.data.projectId));
    if (!p || p.ownerId !== uid) {
      res.status(403).json({ error: "Only the owner can delete" });
      return;
    }
    await db
      .delete(projectMembersTable)
      .where(eq(projectMembersTable.projectId, params.data.projectId));
    await db
      .delete(projectsTable)
      .where(eq(projectsTable.id, params.data.projectId));
    res.json(DeleteProjectResponse.parse({ ok: true }));
  },
);

router.get(
  "/projects/:projectId/members",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectMembersParams.safeParse(req.params);
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
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        email: usersTable.email,
        cookiesAccepted: usersTable.cookiesAccepted,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(eq(projectMembersTable.projectId, params.data.projectId));
    res.json(ListProjectMembersResponse.parse(rows));
  },
);

router.post(
  "/projects/:projectId/members",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = InviteToProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = InviteToProjectBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const uid = getUserId(req);
    if (!(await isMember(params.data.projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const [u] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, parsed.data.userId));
    if (!u) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    await db
      .insert(projectMembersTable)
      .values({ projectId: params.data.projectId, userId: u.id })
      .onConflictDoNothing();
    await db.insert(activityTable).values({
      id: genId(),
      projectId: params.data.projectId,
      actorId: uid,
      kind: "member_joined",
      summary: `added ${u.displayName} to the project`,
    });
    res.json(
      InviteToProjectResponse.parse({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        cookiesAccepted: u.cookiesAccepted,
      }),
    );
  },
);

router.get(
  "/projects/:projectId/stats",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetProjectStatsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const uid = getUserId(req);
    const projectId = params.data.projectId;
    if (!(await isMember(projectId, uid))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const tasks = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.projectId, projectId));

    const now = new Date();
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const overdueTasks = tasks.filter(
      (t) => !t.completed && t.deadline && t.deadline < now,
    ).length;
    const unassignedTasks = tasks.filter((t) => !t.assigneeId).length;

    const members = await db
      .select({
        id: usersTable.id,
        displayName: usersTable.displayName,
      })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(eq(projectMembersTable.projectId, projectId));

    const memberWorkload = members.map((m) => {
      const assigned = tasks.filter((t) => t.assigneeId === m.id);
      return {
        userId: m.id,
        displayName: m.displayName,
        assignedCount: assigned.length,
        completedCount: assigned.filter((t) => t.completed).length,
      };
    });

    res.json(
      GetProjectStatsResponse.parse({
        totalTasks,
        completedTasks,
        overdueTasks,
        unassignedTasks,
        memberWorkload,
      }),
    );
  },
);

export { and };
export default router;
