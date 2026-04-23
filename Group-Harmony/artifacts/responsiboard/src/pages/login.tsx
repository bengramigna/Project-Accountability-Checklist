import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogIn,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Brand } from "@/components/Brand";
import { Footer } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useLogIn({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        navigate("/");
      },
      onError: (e: Error) => {
        setError(e.message.includes("401") ? "Invalid credentials" : e.message);
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between p-10 border-r border-border/60 bg-gradient-to-br from-background via-background to-primary/5">
          <Brand size="lg" />
          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-accent bg-accent/10 border border-accent/30 rounded-full px-3 py-1">
              <Sparkles size={13} /> Built for student teams
            </div>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              The calm command center for <span className="text-gradient-brand">group projects</span>.
            </h1>
            <p className="text-muted-foreground text-lg">
              Form teams, claim tasks, share docs and stay aligned on deadlines —
              without another chaotic group chat.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                Real-time team chat with auto-refresh
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                Per-member workload tracking
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                Deadline radar across every project
              </li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            Try a demo account: <span className="font-mono text-foreground">alex</span> / <span className="font-mono text-foreground">demo1234</span>
          </p>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md border-border/60">
            <CardContent className="p-8">
              <div className="lg:hidden mb-8 flex justify-center">
                <Brand />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to your Responsiboard account.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setError(null);
                  mutation.mutate({ data: { username, password } });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive" data-testid="text-error">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full glow-primary"
                  disabled={mutation.isPending}
                  data-testid="button-login"
                >
                  {mutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      Sign in <ArrowRight size={16} className="ml-1" />
                    </>
                  )}
                </Button>
              </form>
              <p className="mt-6 text-sm text-muted-foreground text-center">
                New here?{" "}
                <Link href="/signup">
                  <a className="text-primary hover:underline" data-testid="link-signup">
                    Create an account
                  </a>
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
