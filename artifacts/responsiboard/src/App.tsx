import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import HomePage from "@/pages/home";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import FriendsPage from "@/pages/friends";
import PrivacyPage from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function FullPageLoader() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Loader2 className="text-primary animate-spin" size={28} />
    </div>
  );
}

function RequireAuth({ children }: { children: (user: NonNullable<ReturnType<typeof useCurrentUser>["user"]>) => ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [isLoading, user, navigate]);
  if (isLoading) return <FullPageLoader />;
  if (!user) return null;
  return <>{children(user)}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isLoading && user) navigate("/");
  }, [isLoading, user, navigate]);
  if (isLoading) return <FullPageLoader />;
  if (user) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">
        <PublicOnly>
          <LoginPage />
        </PublicOnly>
      </Route>
      <Route path="/signup">
        <PublicOnly>
          <SignupPage />
        </PublicOnly>
      </Route>
      <Route path="/">
        <RequireAuth>{(user) => <AppShell user={user}><HomePage user={user} /></AppShell>}</RequireAuth>
      </Route>
      <Route path="/projects">
        <RequireAuth>{(user) => <AppShell user={user}><ProjectsPage /></AppShell>}</RequireAuth>
      </Route>
      <Route path="/projects/:id">
        <RequireAuth>{(user) => <AppShell user={user}><ProjectDetailPage user={user} /></AppShell>}</RequireAuth>
      </Route>
      <Route path="/friends">
        <RequireAuth>{(user) => <AppShell user={user}><FriendsPage /></AppShell>}</RequireAuth>
      </Route>
      <Route path="/privacy">
        <RequireAuth>{(user) => <AppShell user={user}><PrivacyPage /></AppShell>}</RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
