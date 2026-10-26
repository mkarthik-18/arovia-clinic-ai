import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format } from "date-fns";
import { CalendarClock, Mail, MoreHorizontal, Pencil, Phone, Plus, Power, Stethoscope } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { EmptyState, PageContainer, PageHeader } from "@/components/common/page";
import { ActiveBadge, StatusBadge } from "@/components/common/badges";
import { SearchInput } from "@/components/common/table-tools";
import { Field } from "@/components/appointments/appointment-form-dialog";
import { doctorService, useClinic } from "@/services/demo/store";
import { formatTime12, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/types/clinic";

export const Route = createFileRoute("/doctors")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Doctors — Arovia Healthcare Dashboard" },
      { name: "description", content: "Manage Arovia Clinic's doctors, specializations and working hours." },
      { property: "og:title", content: "Doctors — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Manage Arovia Clinic's doctors, specializations and working hours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorsPage,
});

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function DoctorsPage() {
  const doctors = useClinic((s) => s.doctors);
  const appointments = useClinic((s) => s.appointments);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Doctor | "new" | null>(null);
  const [schedule, setSchedule] = useState<Doctor | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return doctors.filter((d) => !t || `${d.name} ${d.specialization}`.toLowerCase().includes(t));
  }, [doctors, q]);

  const toggleActive = (d: Doctor) => {
    doctorService.update(d.id, { active: !d.active });
    toast.success(`${d.name} ${d.active ? "deactivated" : "activated"}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Doctors"
        subtitle="Manage your clinic's medical professionals."
        actions={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search doctors" className="w-52" />
            <Button size="sm" onClick={() => setEditing("new")}><Plus className="size-3.5" /> Add doctor</Button>
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No doctors found" description="Add your first doctor to start taking bookings." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => {
            const todayCount = appointments.filter((a) => a.doctorId === d.id && a.date === today && a.status !== "cancelled").length;
            return (
              <article key={d.id} className={cn("rounded-xl border bg-card p-5 shadow-card", !d.active && "opacity-70")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                      {initials(d.name)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{d.name}</h3>
                      <p className="text-sm text-muted-foreground">{d.specialization}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${d.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(d)}><Pencil className="size-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setSchedule(d)}><CalendarClock className="size-4" /> View schedule</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toggleActive(d)}>
                        <Power className="size-4" /> {d.active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><Phone className="size-3.5" /> {d.phone}</p>
                  <p className="flex items-center gap-2 truncate"><Mail className="size-3.5" /> {d.email}</p>
                </div>
                <div className="mt-4 flex gap-1">
                  {DAYS.map((label, i) => (
                    <span
                      key={label}
                      className={cn(
                        "grid h-6 flex-1 place-items-center rounded text-[10px] font-medium",
                        d.workingDays.includes(i) ? "bg-teal-soft text-teal-soft-foreground" : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      {label[0]}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">
                    {formatTime12(d.startTime)} – {formatTime12(d.endTime)} · {d.slotMinutes} min
                  </span>
                  <ActiveBadge active={d.active} />
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{todayCount} appointments today</div>
              </article>
            );
          })}
        </div>
      )}
      <DoctorFormDialog open={editing !== null} doctor={editing && editing !== "new" ? editing : undefined} onOpenChange={(o) => !o && setEditing(null)} />
      <ScheduleSheet doctor={schedule} onClose={() => setSchedule(null)} />
    </PageContainer>
  );
}

function ScheduleSheet({ doctor, onClose }: { doctor: Doctor | null; onClose: () => void }) {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const days = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd"));
  return (
    <Sheet open={!!doctor} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {doctor && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle>{doctor.name}</SheetTitle>
              <SheetDescription>Next 7 days</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {days.map((day) => {
                const list = appointments
                  .filter((a) => a.doctorId === doctor.id && a.date === day)
                  .sort((a, b) => a.time.localeCompare(b.time));
                return (
                  <section key={day}>
                    <h3 className="mb-1.5 text-xs font-semibold text-muted-foreground">{format(new Date(day + "T00:00"), "EEEE, dd MMM")}</h3>
                    {list.length === 0 ? (
                      <p className="text-sm text-muted-foreground/70">No appointments</p>
                    ) : (
                      <ul className="divide-y rounded-lg border text-sm">
                        {list.map((a) => (
                          <li key={a.id} className="flex items-center justify-between px-3 py-2">
                            <span><span className="tabular-nums text-muted-foreground">{formatTime12(a.time)}</span> · {patients.find((p) => p.id === a.patientId)?.name}</span>
                            <StatusBadge status={a.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const doctorSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the doctor's name").max(80),
    specialization: z.string().trim().min(2, "Enter a specialization").max(60),
    phone: z.string().trim().regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid phone number"),
    email: z.string().trim().email("Enter a valid email"),
    workingDays: z.array(z.number()).min(1, "Choose at least one day"),
    startTime: z.string(),
    endTime: z.string(),
    slotMinutes: z.coerce.number().int().min(10).max(120),
  })
  .refine((v) => v.endTime > v.startTime, { message: "End time must be after start time", path: ["endTime"] });
type DoctorForm = z.infer<typeof doctorSchema>;

function DoctorFormDialog({ open, onOpenChange, doctor }: { open: boolean; onOpenChange: (o: boolean) => void; doctor?: Doctor | undefined }) {
  const { register, control, handleSubmit, reset, formState } = useForm<DoctorForm>({ resolver: zodResolver(doctorSchema) });
  useEffect(() => {
    if (open)
      reset(
        doctor ?? {
          name: "Dr. ",
          specialization: "",
          phone: "+91 ",
          email: "",
          workingDays: [1, 2, 3, 4, 5, 6],
          startTime: "09:00",
          endTime: "20:00",
          slotMinutes: 30,
        },
      );
  }, [open, doctor, reset]);

  const onSubmit = (v: DoctorForm) => {
    if (doctor) {
      doctorService.update(doctor.id, v);
      toast.success("Doctor updated");
    } else {
      doctorService.create({ ...v, active: true });
      toast.success(`${v.name} added`);
    }
    onOpenChange(false);
  };
  const e = formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{doctor ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>Working days and hours decide which slots Arovia Assistant can offer.</DialogDescription>
        </DialogHeader>
        <form id="doctor-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={e.name?.message}><Input {...register("name")} /></Field>
          <Field label="Specialization" error={e.specialization?.message}><Input {...register("specialization")} /></Field>
          <Field label="Phone" error={e.phone?.message}><Input {...register("phone")} /></Field>
          <Field label="Email" error={e.email?.message}><Input type="email" {...register("email")} /></Field>
          <Field label="Working days" error={e.workingDays?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="workingDays"
              render={({ field }) => (
                <div className="flex gap-1">
                  {DAYS.map((label, i) => (
                    <Toggle
                      key={label}
                      size="sm"
                      variant="outline"
                      pressed={field.value?.includes(i)}
                      onPressedChange={(on) =>
                        field.onChange(on ? [...(field.value ?? []), i].sort() : (field.value ?? []).filter((d) => d !== i))
                      }
                      className="flex-1 text-xs data-[state=on]:border-teal data-[state=on]:bg-teal-soft data-[state=on]:text-teal-soft-foreground"
                    >
                      {label}
                    </Toggle>
                  ))}
                </div>
              )}
            />
          </Field>
          <Field label="Start time"><Input type="time" {...register("startTime")} /></Field>
          <Field label="End time" error={e.endTime?.message}><Input type="time" {...register("endTime")} /></Field>
          <Field label="Appointment duration" className="sm:col-span-2">
            <Controller
              control={control}
              name="slotMinutes"
              render={({ field }) => (
                <Select value={String(field.value ?? 30)} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 20, 30, 45, 60].map((m) => (
                      <SelectItem key={m} value={String(m)}>{m} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="doctor-form">{doctor ? "Save changes" : "Add doctor"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
