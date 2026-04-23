import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProject,
  useGetProjectStats,
  useListProjectMembers,
  useListTasks,
  useListNotes,
  useListDocuments,
  useListMessages,
  useListFriends,
  useUpdateProject,
  useDeleteProject,
  useInviteToProject,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCreateNote,
  useDeleteNote,
  useCreateDocument,
  useDeleteDocument,
  useSendMessage,
  getGetProjectQueryKey,
  getGetProjectStatsQueryKey,
  getListProjectMembersQueryKey,
  getListTasksQueryKey,
  getListNotesQueryKey,
  getListDocumentsQueryKey,
  getListMessagesQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ListTodo,
  Users,
  FileText,
  StickyNote,
  MessageSquare,
  CalendarClock,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  Hand,
  AlertTriangle,
  UserPlus,
  Send,
  Upload,
  Settings,
  Pencil,
} from "lucide-react";
import {
  formatDate,
  formatBytes,
  formatRelative,
  deadlineStatus,
} from "@/lib/format";

const NOTE_PLACEHOLDERS = [
  "I'll be out of town next weekend — please ping me on chat.",
  "We should finish the slides by Thursday so we have a day to rehearse.",
  "Heads up: the rubric updated, see the new grading criteria.",
  "Let's split the demo recording into two takes.",
];

export default function ProjectDetailPage({
  user,
}: {
  user: { id: string; displayName: string };
}) {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id ?? "";
  const [, navigate] = useLocation();

  const project = useGetProject(projectId, {
    query: {
      queryKey: getGetProjectQueryKey(projectId),
      enabled: !!projectId,
      retry: false,
    },
  });

  if (project.isLoading) {
    return <div className="h-72 rounded-md bg-muted/40 animate-pulse" />;
  }
  if (project.isError || !project.data) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <AlertTriangle className="mx-auto text-destructive mb-3" />
          <h2 className="font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            It may have been deleted or you don't have access.
          </p>
          <Link href="/projects">
            <Button variant="outline" className="mt-4">
              <ChevronLeft size={14} className="mr-1" /> Back to projects
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <ProjectView
      projectId={projectId}
      projectName={project.data.name}
      deadline={project.data.deadline ?? null}
      ownerId={project.data.ownerId}
      user={user}
      onDeleted={() => navigate("/projects")}
    />
  );
}

function ProjectView({
  projectId,
  projectName,
  deadline,
  ownerId,
  user,
  onDeleted,
}: {
  projectId: string;
  projectName: string;
  deadline: string | null;
  ownerId: string;
  user: { id: string; displayName: string };
  onDeleted: () => void;
}) {
  const [tab, setTab] = useState("overview");
  const isOwner = ownerId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects">
          <a className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1" data-testid="link-back">
            <ChevronLeft size={14} /> All projects
          </a>
        </Link>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-project-name">
              {projectName}
            </h1>
            {deadline && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <CalendarClock size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Due {formatDate(deadline)}</span>
                <Badge
                  variant={
                    deadlineStatus(deadline) === "overdue"
                      ? "destructive"
                      : deadlineStatus(deadline) === "soon"
                        ? "default"
                        : "secondary"
                  }
                >
                  {formatRelative(deadline)}
                </Badge>
              </div>
            )}
          </div>
          <ProjectSettings
            projectId={projectId}
            currentName={projectName}
            currentDeadline={deadline}
            isOwner={isOwner}
            onDeleted={onDeleted}
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 sm:flex sm:w-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            <ListTodo size={14} className="mr-1.5" /> Tasks
          </TabsTrigger>
          <TabsTrigger value="members" data-testid="tab-members">
            <Users size={14} className="mr-1.5" /> Members
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">
            <StickyNote size={14} className="mr-1.5" /> Notes
          </TabsTrigger>
          <TabsTrigger value="documents" data-testid="tab-documents">
            <FileText size={14} className="mr-1.5" /> Docs
          </TabsTrigger>
          <TabsTrigger value="chat" data-testid="tab-chat">
            <MessageSquare size={14} className="mr-1.5" /> Chat
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <OverviewPane projectId={projectId} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <TasksPane projectId={projectId} userId={user.id} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersPane projectId={projectId} ownerId={ownerId} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
          <NotesPane projectId={projectId} userId={user.id} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsPane projectId={projectId} />
        </TabsContent>
        <TabsContent value="chat" className="mt-6">
          <ChatPane projectId={projectId} userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* --------------------------- Project Settings ---------------------------- */

function ProjectSettings({
  projectId,
  currentName,
  currentDeadline,
  isOwner,
  onDeleted,
}: {
  projectId: string;
  currentName: string;
  currentDeadline: string | null;
  isOwner: boolean;
  onDeleted: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [date, setDate] = useState(
    currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 10) : "",
  );
  useEffect(() => {
    setName(currentName);
    setDate(
      currentDeadline ? new Date(currentDeadline).toISOString().slice(0, 10) : "",
    );
  }, [currentName, currentDeadline]);

  const update = useUpdateProject({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          qc.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) }),
          qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }),
        ]);
        setOpen(false);
      },
    },
  });
  const del = useDeleteProject({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        onDeleted();
      },
    },
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} data-testid="button-project-settings">
        <Settings size={14} className="mr-2" /> Settings
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project settings</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({
                projectId,
                data: {
                  name,
                  deadline: date ? new Date(date).toISOString() : null,
                },
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="set-name">Project name</Label>
              <Input
                id="set-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-set-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="set-deadline">Deadline</Label>
              <Input
                id="set-deadline"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-set-deadline"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              {isOwner && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this project? This cannot be undone.")) {
                      del.mutate({ projectId });
                    }
                  }}
                  data-testid="button-delete-project"
                >
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              )}
              <div className="flex-1" />
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={update.isPending} data-testid="button-save-project">
                {update.isPending ? <Loader2 className="animate-spin" size={14} /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------- Overview -------------------------------- */

function OverviewPane({ projectId }: { projectId: string }) {
  const stats = useGetProjectStats(projectId, {
    query: { queryKey: getGetProjectStatsQueryKey(projectId) },
  });

  if (stats.isLoading || !stats.data) {
    return <div className="h-72 rounded-md bg-muted/40 animate-pulse" />;
  }
  const s = stats.data;
  const pct =
    s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;
  const radius = 56;
  const circ = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-border/60">
        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="url(#grad)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ - (circ * pct) / 100}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="text-3xl font-bold" data-testid="stat-pct">
                  {pct}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Complete
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full text-center">
            <Stat label="Tasks" value={s.totalTasks} />
            <Stat label="Done" value={s.completedTasks} accent />
            <Stat label="Overdue" value={s.overdueTasks} danger />
          </div>
          {s.unassignedTasks > 0 && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Hand size={12} />
              {s.unassignedTasks} unclaimed task{s.unassignedTasks === 1 ? "" : "s"} — claim one in Tasks
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-border/60">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Workload by member</h2>
          {s.memberWorkload.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members.</p>
          ) : (
            <div className="space-y-3">
              {s.memberWorkload
                .slice()
                .sort((a, b) => b.assignedCount - a.assignedCount)
                .map((m) => {
                  const max = Math.max(
                    1,
                    ...s.memberWorkload.map((x) => x.assignedCount),
                  );
                  const widthPct = (m.assignedCount / max) * 100;
                  const donePct =
                    m.assignedCount > 0
                      ? (m.completedCount / m.assignedCount) * 100
                      : 0;
                  return (
                    <div key={m.userId} data-testid={`workload-${m.userId}`}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{m.displayName}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {m.completedCount}/{m.assignedCount}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                        <div
                          className="h-full bg-primary/30 transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent"
                          style={{
                            width: `${(widthPct * donePct) / 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-2xl font-bold ${
          accent ? "text-accent" : danger ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

/* --------------------------------- Tasks --------------------------------- */

function TasksPane({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const tasks = useListTasks(projectId, {
    query: { queryKey: getListTasksQueryKey(projectId) },
  });
  const members = useListProjectMembers(projectId, {
    query: { queryKey: getListProjectMembersQueryKey(projectId) },
  });

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }),
      qc.invalidateQueries({ queryKey: getGetProjectStatsQueryKey(projectId) }),
      qc.invalidateQueries({ queryKey: getListProjectsQueryKey() }),
    ]);
  };

  const create = useCreateTask({ mutation: { onSuccess: invalidate } });
  const update = useUpdateTask({ mutation: { onSuccess: invalidate } });
  const del = useDeleteTask({ mutation: { onSuccess: invalidate } });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState<string>("__unassigned");
  const [date, setDate] = useState("");

  const memberMap = new Map((members.data ?? []).map((m) => [m.id, m]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Tasks</h2>
        <Button size="sm" onClick={() => setOpen(true)} className="glow-primary" data-testid="button-new-task">
          <Plus size={14} className="mr-1" /> New task
        </Button>
      </div>

      {tasks.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !tasks.data || tasks.data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No tasks yet — create the first one to get the team moving.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tasks.data.map((t) => {
            const status = deadlineStatus(t.deadline);
            const assigneeUser = t.assigneeId ? memberMap.get(t.assigneeId) : null;
            const isMine = t.assigneeId === userId;
            return (
              <Card
                key={t.id}
                className={`border-border/60 ${
                  t.completed ? "opacity-70" : ""
                }`}
                data-testid={`task-${t.id}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <button
                    onClick={() =>
                      update.mutate({
                        taskId: t.id,
                        data: { completed: !t.completed },
                      })
                    }
                    className="mt-0.5 shrink-0"
                    title={t.completed ? "Mark incomplete" : "Mark complete"}
                    data-testid={`button-toggle-${t.id}`}
                  >
                    {t.completed ? (
                      <CheckCircle2 size={20} className="text-accent" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground hover:text-primary transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium ${
                        t.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </div>
                    {t.description && (
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {t.description}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      {assigneeUser ? (
                        <Badge variant="secondary" className="gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                          {assigneeUser.displayName}
                          {isMine && <span className="text-primary">(you)</span>}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() =>
                            update.mutate({
                              taskId: t.id,
                              data: { assigneeId: userId },
                            })
                          }
                          data-testid={`button-claim-${t.id}`}
                        >
                          <Hand size={12} className="mr-1" /> Claim this task
                        </Button>
                      )}
                      {t.deadline && (
                        <Badge
                          variant={
                            status === "overdue"
                              ? "destructive"
                              : status === "soon"
                                ? "default"
                                : "outline"
                          }
                          className="gap-1 text-xs"
                        >
                          <CalendarClock size={11} /> {formatDate(t.deadline)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => del.mutate({ taskId: t.id })}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    title="Delete task"
                    data-testid={`button-delete-task-${t.id}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(
                {
                  projectId,
                  data: {
                    title,
                    description: desc || null,
                    assigneeId:
                      assignee === "__unassigned" ? null : assignee,
                    deadline: date ? new Date(date).toISOString() : null,
                  },
                },
                {
                  onSuccess: () => {
                    setTitle("");
                    setDesc("");
                    setAssignee("__unassigned");
                    setDate("");
                    setOpen(false);
                  },
                },
              );
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Draft intro slides"
                required
                data-testid="input-task-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <Textarea
                id="task-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What does done look like?"
                rows={3}
                data-testid="input-task-desc"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger data-testid="select-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned">Unassigned</SelectItem>
                    {(members.data ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-deadline">Deadline (optional)</Label>
                <Input
                  id="task-deadline"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  data-testid="input-task-deadline"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending} data-testid="button-submit-task">
                {create.isPending ? <Loader2 className="animate-spin" size={14} /> : "Add task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------------------- Members -------------------------------- */

function MembersPane({
  projectId,
  ownerId,
}: {
  projectId: string;
  ownerId: string;
}) {
  const qc = useQueryClient();
  const members = useListProjectMembers(projectId, {
    query: { queryKey: getListProjectMembersQueryKey(projectId) },
  });
  const friends = useListFriends();

  const memberIds = new Set((members.data ?? []).map((m) => m.id));
  const inviteable = (friends.data ?? []).filter((f) => !memberIds.has(f.id));

  const invite = useInviteToProject({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: getListProjectMembersQueryKey(projectId),
        });
      },
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-border/60">
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary" /> Team
            <span className="text-xs font-mono text-muted-foreground ml-1">
              {members.data?.length ?? 0}
            </span>
          </h2>
          {members.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {members.data?.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/40"
                  data-testid={`member-${m.id}`}
                >
                  <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 font-semibold text-sm">
                    {m.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{m.displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{m.username}
                    </div>
                  </div>
                  {m.id === ownerId && (
                    <Badge variant="outline" className="text-xs">
                      Owner
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <UserPlus size={16} className="text-accent" /> Invite from your friends
          </h2>
          {inviteable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All your friends are already on this project. Add more friends from
              the Friends page.
            </p>
          ) : (
            <ul className="space-y-2">
              {inviteable.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/40"
                >
                  <div className="grid place-items-center w-9 h-9 rounded-full bg-muted font-medium text-sm">
                    {f.displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{f.displayName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{f.username}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => invite.mutate({ projectId, data: { userId: f.id } })}
                    data-testid={`button-invite-${f.id}`}
                  >
                    Invite
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* --------------------------------- Notes --------------------------------- */

function NotesPane({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const notes = useListNotes(projectId, {
    query: { queryKey: getListNotesQueryKey(projectId) },
  });
  const create = useCreateNote({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListNotesQueryKey(projectId) }),
    },
  });
  const del = useDeleteNote({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListNotesQueryKey(projectId) }),
    },
  });
  const [body, setBody] = useState("");
  const placeholder =
    NOTE_PLACEHOLDERS[Math.floor(Math.random() * NOTE_PLACEHOLDERS.length)];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-border/60 h-fit">
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <StickyNote size={16} className="text-accent" /> Post a note
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim()) return;
              create.mutate(
                { projectId, data: { body: body.trim() } },
                { onSuccess: () => setBody("") },
              );
            }}
            className="space-y-3"
          >
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`e.g. ${placeholder}`}
              rows={5}
              data-testid="input-note-body"
            />
            <p className="text-xs text-muted-foreground">
              Notes are great for short status updates everyone should see —
              like "I'm out Friday" or "we should meet Tuesday".
            </p>
            <Button
              type="submit"
              disabled={create.isPending || !body.trim()}
              className="w-full"
              data-testid="button-post-note"
            >
              {create.isPending ? <Loader2 className="animate-spin" size={14} /> : "Post note"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="lg:col-span-2 space-y-3">
        {notes.isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : !notes.data || notes.data.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No notes yet. Post one to share something with your team.
            </CardContent>
          </Card>
        ) : (
          notes.data.map((n) => (
            <Card key={n.id} className="border-border/60" data-testid={`note-${n.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.authorName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </div>
                  </div>
                  {n.authorId === userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => del.mutate({ noteId: n.id })}
                      className="text-muted-foreground hover:text-destructive"
                      data-testid={`button-delete-note-${n.id}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{n.body}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Documents ------------------------------- */

function DocumentsPane({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const docs = useListDocuments(projectId, {
    query: { queryKey: getListDocumentsQueryKey(projectId) },
  });
  const create = useCreateDocument({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(projectId) }),
    },
  });
  const del = useDeleteDocument({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListDocumentsQueryKey(projectId) }),
    },
  });
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Shared documents</h2>
        <Button
          onClick={() => fileRef.current?.click()}
          size="sm"
          className="glow-primary"
          data-testid="button-upload-doc"
        >
          <Upload size={14} className="mr-1" /> Add document
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            create.mutate({
              projectId,
              data: { filename: file.name, sizeBytes: file.size },
            });
            e.target.value = "";
          }}
        />
      </div>
      {docs.isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !docs.data || docs.data.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            No documents shared yet. Add the rubric, an outline, or anything your
            team needs to reference.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.data.map((d) => (
            <Card key={d.id} className="border-border/60" data-testid={`doc-${d.id}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 border border-primary/30 text-primary">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{d.filename}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(d.sizeBytes)} · uploaded by {d.uploadedByName} ·{" "}
                    {formatRelative(d.createdAt)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => del.mutate({ documentId: d.id })}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid={`button-delete-doc-${d.id}`}
                >
                  <Trash2 size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- Chat ---------------------------------- */

function ChatPane({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}) {
  const qc = useQueryClient();
  const messages = useListMessages(projectId, {
    query: {
      queryKey: getListMessagesQueryKey(projectId),
      refetchInterval: 3000,
    },
  });
  const send = useSendMessage({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListMessagesQueryKey(projectId) }),
    },
  });
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.data?.length]);

  return (
    <Card className="border-border/60 flex flex-col h-[70vh]">
      <CardContent className="p-0 flex flex-col h-full">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
          {messages.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : !messages.data || messages.data.length === 0 ? (
            <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-2 text-muted-foreground" />
                <p>Be the first to say hi to your team.</p>
              </div>
            </div>
          ) : (
            messages.data.map((m) => {
              const mine = m.authorId === userId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${m.id}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      mine
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                        : "bg-muted/60 text-foreground"
                    }`}
                  >
                    {!mine && (
                      <div className="text-xs font-semibold mb-0.5 text-primary">
                        {m.authorName}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        mine ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {formatRelative(m.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            send.mutate(
              { projectId, data: { body: body.trim() } },
              { onSuccess: () => setBody("") },
            );
          }}
          className="border-t border-border/60 p-3 flex gap-2"
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Message your team…"
            data-testid="input-message"
          />
          <Button type="submit" disabled={send.isPending || !body.trim()} data-testid="button-send">
            {send.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Send size={14} className="mr-1" /> Send
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// silence unused
export const _icons = { Pencil };
