import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Cookie, Lock, Mail } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy & Cookies</h1>
        <p className="text-muted-foreground mt-1">
          A plain-English summary of how Responsiboard handles your data.
        </p>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-6 space-y-5 prose prose-invert max-w-none">
          <Section icon={Cookie} title="Cookies">
            <p>
              We use a single signed session cookie to keep you logged in. It
              contains only your account ID and is never shared with third parties.
            </p>
          </Section>
          <Section icon={Lock} title="Your data">
            <p>
              Your projects, tasks, notes and messages are visible only to members
              of those projects. We do not sell, rent or share your data with
              advertisers.
            </p>
          </Section>
          <Section icon={ShieldCheck} title="Account & deletion">
            <p>
              You may remove yourself from any project at any time. If you'd like
              your account deleted, send a request to the email below and we'll
              process it within 30 days.
            </p>
          </Section>
          <Section icon={Mail} title="Contact">
            <p>
              Questions? Reach us at{" "}
              <a className="text-primary" href="mailto:hello@responsiboard.app">
                hello@responsiboard.app
              </a>
              .
            </p>
          </Section>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-1">
        <Icon size={18} className="text-primary" /> {title}
      </h2>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
