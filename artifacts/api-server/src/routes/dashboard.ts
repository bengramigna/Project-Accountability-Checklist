import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, ne, sql } from "drizzle-orm";
import {
  db,
  projectsTable,
  projectMembersTable,
  tasksTable,
  friendshipsTable,
  activityTable,
  usersTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetUpcomingDeadlinesResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireAuth, getUserId } from "../lib/auth";

const router: IRouter = Router();

async function getMyProjectIds(uid: string): Promise<string[]> {
  const rows = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, uid));
  return rows.map((r) => r.projectId);
}

router.get(
  "/dashboard/summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const uid = getUserId(req);
    const projectIds = await getMyProjectIds(uid);

    const [{ c: friendCount }] = await db
      .select({ c: count(friendshipsTable.friendId) })
      .from(friendshipsTable)
      .where(eq(friendshipsTable.userId, uid));

    let openTasks = 0;
    let completedTasks = 0;
    let myOpenTasks = 0;
    let upcomingDeadlineCount = 0;

    if (projectIds.length > 0) {
      const tasks = await db
        .select()
        .from(tasksTable)
        .where(inArray(tasksTable.projectId, projectIds));
      openTasks = tasks.filter((t) => !t.completed).length;
      completedTasks = tasks.filter((t) => t.completed).length;
      myOpenTasks = tasks.filter((t) => !t.completed && t.assigneeId === uid)
        .length;
      const now = new Date();
      const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      upcomingDeadlineCount = tasks.filter(
        (t) => !t.completed && t.deadline && t.deadline >= now && t.deadline <= oneWeek,
      ).length;
      const projects = await db
        .select()
        .from(projectsTable)
        .where(inArray(projectsTable.id, projectIds));
      upcomingDeadlineCount += projects.filter(
        (p) => p.deadline && p.deadline >= now && p.deadline <= oneWeek,
      ).length;
    }

    res.json(
      GetDashboardSummaryResponse.parse({
        projectCount: projectIds.length,
        friendCount: Number(friendCount ?? 0),
        openTasks,
        completedTasks,
        myOpenTasks,
        upcomingDeadlineCount,
      }),
    );
  },
);

router.get(
  "/dashboard/upcoming",
  requireAuth,
  async (req, res): Promise<void> => {
    const uid = getUserId(req);
    const projectIds = await getMyProjectIds(uid);
    if (projectIds.length === 0) {
      res.json(GetUpcomingDeadlinesResponse.parse([]));
      return;
    }
    const now = new Date();

    const projects = await db
      .select()
      .from(projectsTable)
      .where(inArray(projectsTable.id, projectIds));
    const projectMap = new Map(projects.map((p) => [p.id, p]));

    const taskRows = await db
      .select({
        id: tasksTable.id,
        projectId: tasksTable.projectId,
        title: tasksTable.title,
        deadline: tasksTable.deadline,
        completed: tasksTable.completed,
        assigneeName: usersTable.displayName,
      })
      .from(tasksTable)
      .leftJoin(usersTable, eq(usersTable.id, tasksTable.assigneeId))
      .where(
        and(
          inArray(tasksTable.projectId, projectIds),
          eq(tasksTable.completed, false),
          isNotNull(tasksTable.deadline),
          gte(tasksTable.deadline, now),
        ),
      )
      .orderBy(asc(tasksTable.deadline))
      .limit(20);

    const items: Array<{
      kind: "task" | "project";
      id: string;
      title: string;
      projectId: string;
      projectName: string;
      deadline: string;
      assigneeName?: string | null;
    }> = [];

    for (const t of taskRows) {
      if (!t.deadline) continue;
      items.push({
        kind: "task",
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: projectMap.get(t.projectId)?.name ?? "",
        deadline: t.deadline.toISOString(),
        assigneeName: t.assigneeName ?? null,
      });
    }
    for (const p of projects) {
      if (p.deadline && p.deadline >= now) {
        items.push({
          kind: "project",
          id: p.id,
          title: p.name,
          projectId: p.id,
          projectName: p.name,
          deadline: p.deadline.toISOString(),
          assigneeName: null,
        });
      }
    }
    items.sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
    res.json(GetUpcomingDeadlinesResponse.parse(items.slice(0, 15)));
  },
);

router.get(
  "/dashboard/activity",
  requireAuth,
  async (req, res): Promise<void> => {
    const uid = getUserId(req);
    const projectIds = await getMyProjectIds(uid);
    if (projectIds.length === 0) {
      res.json(GetRecentActivityResponse.parse([]));
      return;
    }
    const rows = await db
      .select({
        id: activityTable.id,
        kind: activityTable.kind,
        projectId: activityTable.projectId,
        actorId: activityTable.actorId,
        summary: activityTable.summary,
        createdAt: activityTable.createdAt,
        actorName: usersTable.displayName,
        projectName: projectsTable.name,
      })
      .from(activityTable)
      .innerJoin(usersTable, eq(usersTable.id, activityTable.actorId))
      .innerJoin(projectsTable, eq(projectsTable.id, activityTable.projectId))
      .where(inArray(activityTable.projectId, projectIds))
      .orderBy(desc(activityTable.createdAt))
      .limit(25);
    res.json(
      GetRecentActivityResponse.parse(
        rows.map((r) => ({
          id: r.id,
          kind: r.kind as
            | "task_created"
            | "task_completed"
            | "note_added"
            | "message_sent"
            | "document_added"
            | "project_created"
            | "member_joined",
          projectId: r.projectId,
          projectName: r.projectName,
          actorName: r.actorName,
          summary: r.summary,
          createdAt: r.createdAt.toISOString(),
        })),
      ),
    );
  },
);

// re-export to silence unused warnings in case of strict mode
export { ne, sql };
export default router;
