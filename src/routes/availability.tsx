import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { CalendarOff, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageContainer, PageHeader, Panel } from "@/components/common/page";
import { Field } from "@/components/appointments/appointment-form-dialog";
import { availabilityService, useClinic } from "@/services/demo/store";
import { availableSlots, clinicSlotsForDate } from "@/lib/scheduling";
import { formatDate, formatTime12 } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClinicSchedule } from "@/types/clinic";

export const Route = createFileRoute("/availability")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Availability — Arovia Healthcare Dashboard" },
      { name: "description", content: "Set Arovia Clinic's working hours, breaks, holidays and bookable slots." },
      { property: "og:title", content: "Availability — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Set Arovia Clinic's working hours, breaks, holidays and bookable slots." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AvailabilityPage,
});

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

function AvailabilityPage() {
  const saved = useClinic((s) => s.schedule);
  const blocked = useClinic((s) => s.blocked);
  const doctors = useClinic((s) => s.doctors);
  const appointments = useClinic((s) => s.appointments);
  const [draft, setDraft] = useState<ClinicSchedule>(saved);
  const [blockOpen, setBlockOpen] = useState(false);
  const [previewDoctor, setPreviewDoctor] = useState(doctors[0]?.id ?? "");
  const [previewDate, setPreviewDate] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));

  useEffect(() => setDraft(saved), [saved]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const updateDay = (day: number, patch: Partial<ClinicSchedule["week"][number]>) =>
    setDraft((d) => ({ ...d, week: d.week.map((w) => (w.day === day ? { ...w, ...patch } : w)) }));

  const validate = () => {
    for (const w of draft.week) {
      if (!w.open) continue;
      if (!w.sessions.length) return `${DAY_NAMES[w.day]} is open but has no sessions.`;
      const sorted = [...w.sessions].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i]!;
        const prev = sorted[i - 1];
        if (cur.end <= cur.start) return `${DAY_NAMES[w.day]}: a session ends before it starts.`;
        if (prev && cur.start < prev.end) return `${DAY_NAMES[w.day]}: sessions overlap.`;
      }
    }
    return null;
  };

  const save = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    availabilityService.updateSchedule({
      ...draft,
      week: draft.week.map((w) => ({ ...w, sessions: [...w.sessions].sort((a, b) => a.start.localeCompare(b.start)) })),
    });
    toast.success("Clinic schedule saved");
  };

  const doctor = doctors.find((d) => d.id === previewDoctor);
  const preview = useMemo(() => {
    if (!doctor) return { all: [], free: new Set<string>() };
    const all = clinicSlotsForDate(previewDate, draft, blocked, doctor);
    return { all, free: new Set(availableSlots(previewDate, doctor, draft, blocked, appointments)) };
  }, [doctor, previewDate, draft, blocked, appointments]);

  return (
    <PageContainer>
      <PageHeader
        title="Availability"
        subtitle="Controls which slots Arovia Assistant can offer to patients."
        actions={
          <>
            <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setDraft(saved)}>
              <RotateCcw className="size-3.5" /> Discard
            </Button>
            <Button size="sm" disabled={!dirty} onClick={save}>Save schedule</Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Panel title="Weekly schedule" description="Gaps between sessions are treated as breaks." bodyClassName="p-0">
          <ul className="divide-y">
            {ORDER.map((dayNum) => {
              const w = draft.week.find((x) => x.day === dayNum)!;
              return (
                <li key={dayNum} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                  <div className="flex w-40 items-center gap-3 pt-1">
                    <Switch checked={w.open} onCheckedChange={(open) => updateDay(dayNum, { open, sessions: open && !w.sessions.length ? [{ start: "09:00", end: "13:00" }] : w.sessions })} aria-label={`${DAY_NAMES[dayNum]} open`} />
                    <span className={cn("text-sm font-medium", !w.open && "text-muted-foreground")}>{DAY_NAMES[dayNum]}</span>
                  </div>
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    {!w.open ? (
                      <span className="pt-1 text-sm text-muted-foreground">Closed</span>
                    ) : (
                      <>
                        {w.sessions.map((s, i) => (
                          <div key={i} className="flex items-center gap-1 rounded-lg border bg-background p-1">
                            <Input type="time" value={s.start} className="h-7 w-[6.5rem] border-0 text-xs shadow-none"
                              onChange={(e) => updateDay(dayNum, { sessions: w.sessions.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) })} />
                            <span className="text-xs text-muted-foreground">–</span>
                            <Input type="time" value={s.end} className="h-7 w-[6.5rem] border-0 text-xs shadow-none"
                              onChange={(e) => updateDay(dayNum, { sessions: w.sessions.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) })} />
                            <Button variant="ghost" size="icon" className="size-6" aria-label="Remove session"
                              onClick={() => updateDay(dayNum, { sessions: w.sessions.filter((_, j) => j !== i) })}>
                              <X className="size-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="h-8 text-xs"
                          onClick={() => updateDay(dayNum, { sessions: [...w.sessions, { start: "16:00", end: "20:00" }] })}>
                          <Plus className="size-3" /> Add session
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="grid gap-4 border-t px-5 py-4 sm:grid-cols-2">
            <Field label="Default slot duration">
              <Select value={String(draft.slotMinutes)} onValueChange={(v) => setDraft((d) => ({ ...d, slotMinutes: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[15, 20, 30, 45, 60].map((m) => <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Maximum bookings per slot">
              <Select value={String(draft.maxPerSlot)} onValueChange={(v) => setDraft((d) => ({ ...d, maxPerSlot: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3].map((m) => <SelectItem key={m} value={String(m)}>{m} {m === 1 ? "patient" : "patients"}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Slot preview" description="What Arovia Assistant would offer">
            <div className="grid grid-cols-2 gap-2">
              <Select value={previewDoctor} onValueChange={setPreviewDoctor}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={previewDate} onChange={(e) => setPreviewDate(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="mt-4">
              {preview.all.length === 0 ? (
                <p className="rounded-lg bg-muted px-3 py-6 text-center text-sm text-muted-foreground">
                  {doctor && !doctor.active ? "This doctor is inactive." : "No slots — closed, blocked, or doctor not working."}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-1.5">
                    {preview.all.map((t) => {
                      const free = preview.free.has(t);
                      return (
                        <span key={t} className={cn(
                          "rounded-md border px-1 py-1.5 text-center text-xs tabular-nums",
                          free ? "border-teal/30 bg-teal-soft text-teal-soft-foreground" : "bg-muted text-muted-foreground line-through",
                        )}>
                          {formatTime12(t)}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {preview.free.size} of {preview.all.length} slots free. Booked slots are struck through.
                  </p>
                </>
              )}
            </div>
          </Panel>

          <Panel
            title="Holidays & blocked dates"
            actions={<Button size="sm" variant="outline" onClick={() => setBlockOpen(true)}><Plus className="size-3.5" /> Block date</Button>}
            bodyClassName="p-0"
          >
            {blocked.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">No blocked dates.</p>
            ) : (
              <ul className="divide-y">
                {[...blocked].sort((a, b) => a.date.localeCompare(b.date)).map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                    <CalendarOff className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1 text-sm">
                      <div className="font-medium">{formatDate(b.date, "EEE, dd MMM yyyy")}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {b.reason} · {b.doctorId ? doctors.find((d) => d.id === b.doctorId)?.name : "Whole clinic"}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Remove blocked date"
                      onClick={() => { availabilityService.removeBlocked(b.id); toast.success("Date unblocked"); }}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
      <BlockDateDialog open={blockOpen} onOpenChange={setBlockOpen} />
    </PageContainer>
  );
}

function BlockDateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const doctors = useClinic((s) => s.doctors);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("clinic");
  useEffect(() => {
    if (open) { setDate(format(addDays(new Date(), 1), "yyyy-MM-dd")); setReason(""); setScope("clinic"); }
  }, [open]);

  const submit = () => {
    if (!date) {
      toast.error("Pick a date");
      return;
    }
    if (reason.trim().length < 2) {
      toast.error("Add a short reason");
      return;
    }
    availabilityService.addBlocked({ date, reason: reason.trim(), doctorId: scope === "clinic" ? undefined : scope });
    toast.success("Date blocked");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Block a date</DialogTitle>
          <DialogDescription>No slots will be offered on this date.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Reason"><Input value={reason} maxLength={80} placeholder="e.g. Diwali holiday" onChange={(e) => setReason(e.target.value)} /></Field>
          <Field label="Applies to">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="clinic">Whole clinic</SelectItem>
                {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name} only</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Block date</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
