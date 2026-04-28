import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSignUp,
  useAcceptCookies,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Brand } from "@/components/Brand";
import { Footer } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptCookies = useAcceptCookies();
  const signup = useSignUp({
    mutation: {
      onSuccess: async () => {
        if (accept) {
          try {
            await acceptCookies.mutateAsync();
          } catch {
            // ignore
          }
        }
        await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        navigate("/");
      },
      onError: (e: Error) => {
        setError(
          e.message.includes("409")
            ? "That username is already taken"
            : e.message,
        );
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <Card className="w-full max-w-md border-border/60">
          <CardContent className="p-8">
            <div className="flex justify-center mb-8">
              <Brand />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Start coordinating your group projects in minutes.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setError(null);
                if (!accept) {
                  setError("You must accept the cookies & privacy policy to sign up.");
                  return;
                }
                signup.mutate({
                  data: { username, displayName, email, password },
                });
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display name</Label>
                  <Input
                    id="displayName"
                    data-testid="input-displayname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">School email</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  minLength={4}
                  required
                />
              </div>
              <label className="flex items-start gap-3 text-sm leading-snug cursor-pointer pt-1">
                <Checkbox
                  checked={accept}
                  onCheckedChange={(v) => setAccept(v === true)}
                  data-testid="checkbox-accept"
                />
                <span className="text-muted-foreground">
                  I accept the{" "}
                  <Link href="/privacy">
                    <a className="text-primary hover:underline">cookies & privacy policy</a>
                  </Link>
                  .
                </span>
              </label>
              {error && (
                <div className="text-sm text-destructive" data-testid="text-error">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full glow-primary"
                disabled={signup.isPending}
                data-testid="button-signup"
              >
                {signup.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    Create account <ArrowRight size={16} className="ml-1" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-sm text-muted-foreground text-center">
              Already a member?{" "}
              <Link href="/login">
                <a className="text-primary hover:underline" data-testid="link-login">
                  Sign in
                </a>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
