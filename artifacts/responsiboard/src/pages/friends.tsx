import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFriends,
  useSearchUsers,
  useAddFriend,
  useRemoveFriend,
  getListFriendsQueryKey,
  getSearchUsersQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, UserMinus, Users, Loader2 } from "lucide-react";

export default function FriendsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const friends = useListFriends();
  const search = useSearchUsers(
    { q },
    { query: { queryKey: getSearchUsersQueryKey({ q }) } },
  );

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: getListFriendsQueryKey() }),
      qc.invalidateQueries({ queryKey: getSearchUsersQueryKey({ q }) }),
    ]);
  };
  const addFriend = useAddFriend({ mutation: { onSuccess: invalidate } });
  const removeFriend = useRemoveFriend({ mutation: { onSuccess: invalidate } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="text-muted-foreground mt-1">
          Find classmates and add them so you can invite them to projects.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by username or display name…"
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              {q ? "Search results" : "People you might know"}
            </h2>
            {search.isLoading ? (
              <SkeletonList />
            ) : !search.data || search.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No people found.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {search.data.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 py-3"
                    data-testid={`search-user-${u.id}`}
                  >
                    <Avatar name={u.displayName} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{u.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        @{u.username} · {u.email}
                      </div>
                    </div>
                    {u.isFriend ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFriend.mutate({ userId: u.id })}
                        data-testid={`button-remove-${u.id}`}
                      >
                        <UserMinus size={14} className="mr-1" /> Remove
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => addFriend.mutate({ userId: u.id })}
                        data-testid={`button-add-${u.id}`}
                      >
                        <UserPlus size={14} className="mr-1" /> Add
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Users size={16} className="text-accent" />
            Your friends
            <span className="text-xs font-mono text-muted-foreground ml-1">
              {friends.data?.length ?? 0}
            </span>
          </h2>
          {friends.isLoading ? (
            <SkeletonList />
          ) : !friends.data || friends.data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              You haven't added any friends yet. Search above to start.
            </p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2">
              {friends.data.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/40"
                  data-testid={`friend-${f.id}`}
                >
                  <Avatar name={f.displayName} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">
                      {f.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{f.username}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFriend.mutate({ userId: f.id })}
                    title="Remove friend"
                    data-testid={`button-remove-friend-${f.id}`}
                  >
                    {removeFriend.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UserMinus size={14} />
                    )}
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

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 text-foreground font-semibold text-sm shrink-0">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
      ))}
    </div>
  );
}
