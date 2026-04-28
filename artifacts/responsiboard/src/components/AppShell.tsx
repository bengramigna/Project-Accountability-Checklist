import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLogOut,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Brand } from "./Brand";
import { Button } from "@/components/ui/button";
import { LogOut, Home, FolderKanban, UserSearch, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/friends", label: "Friends", icon: UserSearch },
  { href: "/privacy", label: "Privacy", icon: ShieldCheck },
];

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user: { displayName: string; username: string };
}) {
  const [loc, navigate] = useLocation();
  const qc = useQueryClient();
  const logout = useLogOut({
    mutation: {
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        qc.clear();
        navigate("/login");
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur-xl bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" data-testid="link-home">
            <a className="flex items-center">
              <Brand />
            </a>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active =
                item.href === "/" ? loc === "/" : loc.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    data-testid={`nav-${item.label.toLowerCase()}`}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium" data-testid="text-user-display">
                {user.displayName}
              </span>
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            </div>
            <div className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout.mutate()}
              data-testid="button-logout"
              title="Log out"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
        <nav className="md:hidden border-t border-border/60 px-2 py-1 flex justify-between">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? loc === "/" : loc.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex-1 text-center px-2 py-2 rounded-md text-xs font-medium flex flex-col items-center gap-0.5 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <div>© {new Date().getFullYear()} Responsiboard</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy"><a className="hover:text-foreground">Terms</a></Link>
          <Link href="/privacy"><a className="hover:text-foreground">Privacy</a></Link>
          <a href="mailto:hello@responsiboard.app" className="hover:text-foreground">Contact</a>
        </div>
      </div>
    </footer>
  );
}
