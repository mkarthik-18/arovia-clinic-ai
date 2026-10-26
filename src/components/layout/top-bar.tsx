import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { Bell, CalendarDays, LogOut, Search, Settings, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { allNav } from "@/lib/nav";
import { useClinic } from "@/services/demo/store";

function useToday() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const patients = useClinic((s) => s.patients);
  const doctors = useClinic((s) => s.doctors);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 w-8 justify-start gap-2 px-2 text-muted-foreground sm:w-56"
      >
        <Search className="size-3.5" />
        <span className="hidden text-xs sm:inline">Search…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, patients or doctors…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {allNav.map((n) => (
              <CommandItem key={n.to} onSelect={() => go(() => navigate({ to: n.to }))}>
                <n.icon className="size-4" />
                {n.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Patients">
            {patients.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.phone} ${p.id}`}
                onSelect={() => go(() => navigate({ to: "/patients", search: { q: p.name } }))}
              >
                <User className="size-4" />
                {p.name}
                <span className="ml-auto text-xs text-muted-foreground">{p.phone}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Doctors">
            {doctors.map((d) => (
              <CommandItem key={d.id} value={`${d.name} ${d.specialization}`} onSelect={() => go(() => navigate({ to: "/doctors" }))}>
                <User className="size-4" />
                {d.name}
                <span className="ml-auto text-xs text-muted-foreground">{d.specialization}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function Notifications() {
  const activity = useClinic((s) => s.activity);
  const [seen, setSeen] = useState(0);
  const unread = Math.max(0, Math.min(activity.length, 5) - seen);
  return (
    <DropdownMenu onOpenChange={(o) => o && setSeen(Math.min(activity.length, 5))}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8" aria-label="Notifications">
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-teal ring-2 ring-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications <span className="text-[10px] font-normal text-muted-foreground">Demo</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {activity.slice(0, 5).map((a) => (
          <DropdownMenuItem key={a.id} asChild>
            <Link to="/appointments" className="flex flex-col items-start gap-0.5 py-2">
              <span className="text-sm">{a.text}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.at), { addSuffix: true })}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const now = useToday();
  const current = useMemo(
    () => allNav.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to))) ?? allNav[0]!,
    [pathname],
  );
  const adminName = useClinic((s) => s.settings.adminName);
  const adminEmail = useClinic((s) => s.settings.adminEmail);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
      <SidebarTrigger className="-ml-1 size-8" />
      <Separator orientation="vertical" className="h-5" />
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground">
          Arovia Healthcare Dashboard <span className="mx-1">/</span>
          <span className="text-foreground/70">{current.title}</span>
        </nav>
        <div className="truncate text-sm font-semibold text-foreground">{current.title}</div>
      </div>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <GlobalSearch />
        {now && (
          <span className="hidden items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground lg:flex">
            <CalendarDays className="size-3.5" />
            {format(now, "EEE, dd MMM yyyy")}
          </span>
        )}
        <Notifications />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Admin menu"
            >
              AD
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="text-sm">{adminName}</div>
              <div className="text-xs font-normal text-muted-foreground">{adminEmail}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings", search: { tab: "profile" } })}>
              <User className="size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <Settings className="size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/login" })}>
              <LogOut className="size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
