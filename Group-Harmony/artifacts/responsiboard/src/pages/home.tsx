import { Link } from "wouter";
import {
  useGetDashboardSummary,
  useGetUpcomingDeadlines,
  useGetRecentActivity,
  useListProjects,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative, formatDate, deadlineStatus } from "@/lib/format";
import {
  FolderKanban,
  Users,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  ArrowRight,
  Activity,
  CalendarClock,
  PlusCircle,
  MessageSquare,
  FileText,
  StickyNote,
  UserPlus,
} from "lucide-react";

const ACTIVITY_ICON: Record<string, typeof MessageSquare> = {
  message_sent: MessageSquare,
  document_added: FileText,
  note_added: StickyNote,
  task_created: ListTodo,
  task_completed: CheckCircle2,
  member_joined: UserPlus,
  project_created: FolderKanban,
};

export default function HomePage({
  user,
}: {
  user: { displayName: string };
}) {
  const summary = useGetDashboardSummary();
  const upcoming = useGetUpcomingDeadlines();
  const activity = useGetRecentActivity();
  const projects = useListProjects();

  const s = summary.data;
  const stats = [
    {
      label: "Projects",
      value: s?.projectCount ?? 0,
      icon: FolderKanban,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    {
      label: "Friends",
      value: s?.friendCount ?? 0,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10 border-accent/30",
    },
    {
      label: "My open tasks",
      value: s?.myOpenTasks ?? 0,
      icon: ListTodo,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/30",
    },
    {
      label: "Completed",
      value: s?.completedTasks ?? 0,
      icon: CheckCircle2,
      color: "text-accent",
      bg: "bg-accent/10 border-accent/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            Welcome back, <span className="text-gradient-brand">{user.displayName.split(" ")[0]}</span>
          </h1>
        </div>
        <Link href="/projects">
          <Button data-testid="button-go-projects" className="glow-primary">
            <PlusCircle size={16} className="mr-2" /> Open projects
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight" data-testid={`stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}>
                      {summary.isLoading ? "—" : stat.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-md border ${stat.bg}`}>
                    <Icon size={18} className={stat.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <CalendarClock size={18} className="text-primary" />
                Upcoming deadlines
              </h2>
              <Badge variant="secondary" className="font-mono">
                {upcoming.data?.length ?? 0}
              </Badge>
            </div>
            {upcoming.isLoading ? (
              <SkeletonRows />
            ) : !upcoming.data || upcoming.data.length === 0 ? (
              <EmptyHint
                icon={CalendarClock}
                title="No deadlines on the radar"
                hint="When tasks or projects have due dates, they'll appear here."
              />
            ) : (
              <div className="space-y-2">
                {upcoming.data.map((d) => {
                  const status = deadlineStatus(d.deadline);
                  return (
                    <Link
                      key={`${d.kind}-${d.id}`}
                      href={`/projects/${d.projectId}`}
                    >
                      <a
                        className="flex items-center justify-between rounded-md px-3 py-3 border border-transparent hover:border-border hover-elevate"
                        data-testid={`upcoming-${d.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-md border ${
                              status === "overdue"
                                ? "bg-destructive/15 border-destructive/30 text-destructive"
                                : status === "soon"
                                  ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                                  : "bg-primary/10 border-primary/30 text-primary"
                            }`}
                          >
                            {d.kind === "task" ? (
                              <ListTodo size={16} />
                            ) : (
                              <FolderKanban size={16} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{d.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {d.projectName}
                              {d.assigneeName ? ` · ${d.assigneeName}` : ""}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <div className="text-sm font-medium">
                            {formatDate(d.deadline)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatRelative(d.deadline)}
                          </div>
                        </div>
                      </a>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity size={18} className="text-accent" />
                Recent activity
              </h2>
            </div>
            {activity.isLoading ? (
              <SkeletonRows />
            ) : !activity.data || activity.data.length === 0 ? (
              <EmptyHint
                icon={Activity}
                title="No activity yet"
                hint="Team actions will show up here as they happen."
              />
            ) : (
              <ul className="space-y-3">
                {activity.data.slice(0, 8).map((a) => {
                  const Icon = ACTIVITY_ICON[a.kind] ?? Activity;
                  return (
                    <li key={a.id} className="flex gap-3 text-sm">
                      <div className="mt-0.5 p-1.5 rounded-md bg-muted/60 text-muted-foreground border border-border/60 shrink-0">
                        <Icon size={13} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-foreground">
                          <span className="font-medium">{a.actorName}</span>{" "}
                          <span className="text-muted-foreground">{a.summary}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.projectName} · {formatRelative(a.createdAt)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Your projects</h2>
          <Link href="/projects">
            <a className="text-sm text-primary hover:underline flex items-center gap-1" data-testid="link-all-projects">
              View all <ArrowRight size={14} />
            </a>
          </Link>
        </div>
        {projects.isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !projects.data || projects.data.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="p-10 text-center">
              <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-primary/10 border border-primary/30 mb-3">
                <FolderKanban className="text-primary" size={20} />
              </div>
              <p className="font-medium">No projects yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some friends, then create your first project to get going.
              </p>
              <Link href="/friends">
                <Button variant="outline" className="mt-4">
                  <UserPlus size={14} className="mr-2" /> Find friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.data.slice(0, 6).map((p) => {
              const pct =
                p.taskCount > 0
                  ? Math.round((p.completedTaskCount / p.taskCount) * 100)
                  : 0;
              return (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <a className="block group" data-testid={`home-project-${p.id}`}>
                    <Card className="h-full border-border/60 hover-elevate">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold leading-tight group-hover:text-primary transition-colors">
                            {p.name}
                          </div>
                          {p.deadline && (
                            <Badge
                              variant={
                                deadlineStatus(p.deadline) === "overdue"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="shrink-0 text-xs"
                            >
                              {formatRelative(p.deadline)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {p.memberCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={12} /> {p.completedTaskCount}/{p.taskCount}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {(s?.openTasks ?? 0) === 0 &&
        (s?.completedTasks ?? 0) > 0 && (
          <Card className="border-accent/40 bg-accent/5">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="text-accent" />
              <div className="text-sm">
                Nice work — your team has no open tasks right now.
              </div>
            </CardContent>
          </Card>
        )}

      {(s?.upcomingDeadlineCount ?? 0) > 0 && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock size={12} />
          {s?.upcomingDeadlineCount} {s?.upcomingDeadlineCount === 1 ? "deadline" : "deadlines"} in the next 7 days
        </div>
      )}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-32 rounded-md bg-muted/40 animate-pulse" />;
}

function EmptyHint({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof AlertCircle;
  title: string;
  hint: string;
}) {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-10 h-10 grid place-items-center rounded-full bg-muted/60 border border-border/60 mb-2">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{hint}</p>
    </div>
  );
}
