import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, isToday, parseISO } from "date-fns";
import {
  ArrowLeft,
  Bot,
  CalendarCheck2,
  Info,
  MessagesSquare,
  PanelRightClose,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationBadge, DemoBadge, StatusBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/page";
import { SearchInput } from "@/components/common/table-tools";
import { conversationService, useClinic } from "@/services/demo/store";
import { formatDate, formatTime12, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/clinic";

export const Route = createFileRoute("/conversations")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { id?: string | undefined } => ({
    id: typeof s["id"] === "string" ? s["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Conversations — Arovia Healthcare Dashboard" },
      {
        name: "description",
        content: "Review sample conversations for Arovia Assistant. WhatsApp is not connected.",
      },
      { property: "og:title", content: "Conversations — Arovia Healthcare Dashboard" },
      {
        property: "og:description",
        content: "Review sample conversations for Arovia Assistant. WhatsApp is not connected.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConversationsPage,
});

const lastAt = (c: Conversation) => c.messages.at(-1)?.at ?? "";
const stamp = (iso: string) =>
  isToday(parseISO(iso)) ? format(parseISO(iso), "hh:mm a") : format(parseISO(iso), "dd MMM");

function ConversationsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const conversations = useClinic((s) => s.conversations);
  const patients = useClinic((s) => s.patients);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showInfo, setShowInfo] = useState(true);

  const pmap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...conversations]
      .filter((c) => filter === "all" || c.status === filter)
      .filter((c) => {
        const p = pmap.get(c.patientId);
        return !t || `${p?.name} ${p?.phone}`.toLowerCase().includes(t);
      })
      .sort((a, b) => lastAt(b).localeCompare(lastAt(a)));
  }, [conversations, filter, q, pmap]);

  const selectedId = search.id;
  const selected = conversations.find((c) => c.id === selectedId);

  useEffect(() => {
    if (selected && selected.unread > 0) conversationService.markRead(selected.id);
  }, [selected]);

  const select = (id?: string) => navigate({ search: { id }, replace: true });

  return (
    <div className="flex h-[calc(100svh-4rem)] min-h-[520px]">
      {/* List */}
      <aside
        className={cn(
          "flex w-full flex-col border-r bg-card md:w-80 lg:w-96",
          selected && "hidden md:flex",
        )}
      >
        <div className="space-y-2 border-b p-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">Conversations</h1>
            <DemoBadge />
          </div>
          <SearchInput value={q} onChange={setQ} placeholder="Search name or number" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All conversations</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="needs-attention">Needs attention</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {list.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">
              No conversations match.
            </li>
          )}
          {list.map((c) => {
            const p = pmap.get(c.patientId);
            const last = [...c.messages].reverse().find((m) => m.text);
            return (
              <li key={c.id}>
                <button
                  onClick={() => select(c.id)}
                  className={cn(
                    "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60",
                    c.id === selectedId && "bg-teal-soft/60",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(p?.name ?? "?")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{p?.name}</span>
                      <span
                        className={cn(
                          "shrink-0 text-[11px]",
                          c.unread ? "font-medium text-teal" : "text-muted-foreground",
                        )}
                      >
                        {stamp(lastAt(c))}
                      </span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{p?.phone}</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">
                        {last?.from === "assistant" && "Assistant: "}
                        {last?.text}
                      </span>
                      {c.unread > 0 && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-semibold text-teal-foreground">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5">
                      <ConversationBadge status={c.status} />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Thread */}
      {selected ? (
        <Thread
          conversation={selected}
          showInfo={showInfo}
          onToggleInfo={() => setShowInfo((s) => !s)}
          onBack={() => select(undefined)}
        />
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-muted/30 md:flex">
          <EmptyState
            icon={MessagesSquare}
            title="Select a conversation"
            description="Sample conversations show how Arovia Assistant may handle WhatsApp messages after the integration is connected. This is a read-only demo."
          />
        </div>
      )}
    </div>
  );
}

function Thread({
  conversation: c,
  showInfo,
  onToggleInfo,
  onBack,
}: {
  conversation: Conversation;
  showInfo: boolean;
  onToggleInfo: () => void;
  onBack: () => void;
}) {
  const patient = useClinic((s) => s.patients.find((p) => p.id === c.patientId));
  const appointments = useClinic((s) => s.appointments);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const mine = appointments
    .filter((a) => a.patientId === c.patientId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex min-w-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={onBack}
            aria-label="Back to list"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="grid size-9 place-items-center rounded-full bg-teal-soft text-xs font-semibold text-teal-soft-foreground">
            {initials(patient?.name ?? "?")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{patient?.name}</div>
            <div className="text-xs text-muted-foreground">{patient?.phone}</div>
          </div>
          <Select
            value={c.status}
            onValueChange={(v) => {
              conversationService.setStatus(c.id, v as Conversation["status"]);
              toast.success("Conversation status updated");
            }}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="needs-attention">Needs attention</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-8 xl:inline-flex"
            onClick={onToggleInfo}
            aria-label="Toggle patient details"
          >
            {showInfo ? <PanelRightClose className="size-4" /> : <Info className="size-4" />}
          </Button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto bg-muted/40 px-4 py-6 sm:px-8">
          <div className="mx-auto mb-4 w-fit rounded-md bg-card px-2.5 py-1 text-[11px] text-muted-foreground shadow-card">
            {c.messages[0] && format(parseISO(c.messages[0].at), "EEEE, dd MMM yyyy")}
          </div>
          {c.messages.map((m) => {
            if (m.kind === "booking") {
              const a = appointments.find((x) => x.id === m.appointmentId);
              if (!a) return null;
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="w-full max-w-xs rounded-xl border border-teal/30 bg-card p-3 shadow-card">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal">
                      <CalendarCheck2 className="size-4" /> Booking confirmed
                    </div>
                    <div className="mt-2 space-y-0.5 text-sm">
                      <div className="font-medium">
                        {services.find((s) => s.id === a.serviceId)?.name}
                      </div>
                      <div className="text-muted-foreground">
                        {doctors.find((d) => d.id === a.doctorId)?.name}
                      </div>
                      <div className="text-muted-foreground">
                        {formatDate(a.date, "EEE, dd MMM")} · {formatTime12(a.time)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                </div>
              );
            }
            const mineSide = m.from === "assistant";
            return (
              <div key={m.id} className={cn("flex", mineSide ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-card",
                    mineSide
                      ? "rounded-br-md bg-teal-soft text-foreground"
                      : "rounded-bl-md bg-card text-foreground",
                  )}
                >
                  {mineSide && (
                    <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-teal-soft-foreground">
                      <Bot className="size-3" /> Arovia Assistant
                    </div>
                  )}
                  <p className="leading-relaxed">{m.text}</p>
                  <div className="mt-0.5 text-right text-[10px] text-muted-foreground">
                    {format(parseISO(m.at), "hh:mm a")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer className="border-t bg-card px-4 py-3 text-center text-xs text-muted-foreground">
          These sample replies illustrate how Arovia Assistant may respond over WhatsApp. Manual
          replies are not available until WhatsApp is connected in{" "}
          <Link
            to="/settings"
            search={{ tab: "whatsapp" }}
            className="font-medium text-teal underline-offset-2 hover:underline"
          >
            Settings
          </Link>
          .
        </footer>
      </section>

      {showInfo && patient && (
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l bg-card p-5 xl:block">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-full bg-teal-soft text-base font-semibold text-teal-soft-foreground">
              {initials(patient.name)}
            </span>
            <div className="mt-2 font-semibold">{patient.name}</div>
            <div className="text-xs text-muted-foreground">
              {patient.id} · {patient.age} yrs
            </div>
          </div>
          <div className="mt-5 space-y-1.5 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5" /> {patient.phone}
            </p>
            {patient.email && <p className="truncate text-muted-foreground">{patient.email}</p>}
          </div>
          <h3 className="mt-6 mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Appointments
          </h3>
          <ul className="space-y-2">
            {mine.slice(0, 4).map((a) => (
              <li key={a.id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {formatDate(a.date, "dd MMM")} · {formatTime12(a.time)}
                  </span>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-1 text-muted-foreground">
                  {services.find((s) => s.id === a.serviceId)?.name}
                </div>
              </li>
            ))}
            {mine.length === 0 && (
              <li className="text-xs text-muted-foreground">No appointments yet.</li>
            )}
          </ul>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <Link to="/patients" search={{ q: patient.name }}>
              Open patient record
            </Link>
          </Button>
        </aside>
      )}
    </div>
  );
}
