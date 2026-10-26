import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AroviaLogo } from "@/components/brand/logo";
import visual from "@/assets/login-visual.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Arovia Clinic AI" },
      {
        name: "description",
        content: "Sign in to the Arovia Healthcare Dashboard to manage your clinic.",
      },
      { property: "og:title", content: "Sign in — Arovia Clinic AI" },
      {
        property: "og:description",
        content: "Care that understands you. Sign in to manage your clinic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c5.34 0 8.88-3.75 8.88-9.04 0-.61-.07-1.07-.15-1.53z"
      />
    </svg>
  );
}

function LoginPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r bg-card lg:flex lg:flex-col">
        <img
          src={visual}
          alt=""
          width={1024}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <AroviaLogo subtitle="Healthcare Management" />
          <div className="max-w-md rounded-2xl border bg-card/80 p-6 shadow-pop backdrop-blur-sm">
            <p className="text-xs font-medium tracking-wide text-teal uppercase">Arovia Clinic</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Care that understands you.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              When connected, Arovia Assistant will answer patients on WhatsApp, find a free slot
              and book the visit. For now, explore the dashboard with sample data.
            </p>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AroviaLogo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage your clinic.</p>

          <div className="mt-8 space-y-3">
            <Button variant="outline" className="h-10 w-full gap-2" disabled>
              <GoogleIcon /> Continue with Google
            </Button>
            <p className="rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Google sign-in is switched on when the clinic's secure backend is connected. Until
              then you can explore the dashboard with sample data.
            </p>
            <Button asChild className="h-10 w-full gap-2">
              <Link to="/">
                Explore demo dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Lock className="size-3.5" /> Secure sign-in. We never see your Google password.
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-3.5" /> Only invited clinic staff get admin access.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
