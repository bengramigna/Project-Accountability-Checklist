import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProjects,
  useListFriends,
  useCreateProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Users,
  CheckCircle2,
  CalendarClock,
  FolderKanban,
  Loader2,
  UserPlus,
} from "lucide-react";
import { formatDate, formatRelative, deadlineStatus } from "@/lib/format";

export default function ProjectsPage() {
  const projects = useListProjects();
  const friends = useListFriends();
  const [open, setOpen] = useState(false);

  const hasFriends = (friends.data?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Every group project you're part of, in one place.
          </p>
        </div>
        <CreateButton
          disabled={!hasFriends}
          onClick={() => setOpen(true)}
        />
      </div>

      {projects.isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !projects.data || projects.data.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-14 h-14 grid place-items-center rounded-full bg-primary/10 border border-primary/30 mb-4">
              <FolderKanban className="text-primary" size={24} />
            </div>
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
              {hasFriends
                ? "Spin up your first project to start coordinating with your team."
                : "Add at least one friend before creating a project — projects are made for teams."}
            </p>
            <div className="mt-6">
              {hasFriends ? (
                <Button onClick={() => setOpen(true)} className="glow-primary" data-testid="button-create-empty">
                  <Plus size={16} className="mr-1" /> Create your first project
                </Button>
              ) : (
                <Link href="/friends">
                  <Button variant="outline" data-testid="button-find-friends">
                    <UserPlus size={14} className="mr-2" /> Find friends
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.data.map((p) => {
            const pct =
              p.taskCount > 0
                ? Math.round((p.completedTaskCount / p.taskCount) * 100)
                : 0;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <a className="block group" data-testid={`project-card-${p.id}`}>
                  <Card className="h-full border-border/60 hover-elevate">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
                          {p.name}
                        </h3>
                        {p.deadline && (
                          <Badge
                            variant={
                              deadlineStatus(p.deadline) === "overdue"
                                ? "destructive"
                                : deadlineStatus(p.deadline) === "soon"
                                  ? "default"
                                  : "secondary"
                            }
                            className="shrink-0"
                          >
                            <CalendarClock size={11} className="mr-1" />
                            {formatRelative(p.deadline)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Users size={13} /> {p.memberCount} members
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> {p.completedTaskCount}/{p.taskCount} tasks
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium font-mono">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {p.deadline && (
                        <div className="text-xs text-muted-foreground">
                          Due {formatDate(p.deadline)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectDialog
        open={open}
        onOpenChange={setOpen}
        friends={friends.data ?? []}
      />
    </div>
  );
}

function CreateButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  if (!disabled) {
    return (
      <Button onClick={onClick} className="glow-primary" data-testid="button-create-project">
        <Plus size={16} className="mr-1" /> Create project
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0}>
          <Button disabled className="opacity-60 cursor-not-allowed" data-testid="button-create-project">
            <Plus size={16} className="mr-1" /> Create project
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Add at least one friend before creating a project
      </TooltipContent>
    </Tooltip>
  );
}

function CreateProjectDialog({
  open,
  onOpenChange,
  friends,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  friends: { id: string; displayName: string; username: string }[];
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const create = useCreateProject({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setName("");
        setSelected(new Set());
        onOpenChange(false);
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/60">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            create.mutate({
              data: { name: name.trim(), memberIds: Array.from(selected) },
            });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CS Capstone — Final Presentation"
              required
              data-testid="input-project-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Invite teammates</Label>
            <div className="max-h-48 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/40">
              {friends.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No friends to invite yet.
                </div>
              ) : (
                friends.map((f) => {
                  const checked = selected.has(f.id);
                  return (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover-elevate"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = new Set(selected);
                          if (v === true) next.add(f.id);
                          else next.delete(f.id);
                          setSelected(next);
                        }}
                        data-testid={`invite-${f.id}`}
                      />
                      <div className="grid place-items-center w-7 h-7 rounded-full bg-muted text-xs font-medium">
                        {f.displayName.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {f.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{f.username}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="glow-primary" disabled={create.isPending} data-testid="button-submit-project">
              {create.isPending ? <Loader2 className="animate-spin" size={16} /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
