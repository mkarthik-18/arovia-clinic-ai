import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO, subDays } from "date-fns";
import { MessageCircle, Pencil, Plus, UserPlus, UserRoundCheck, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, PageContainer, PageHeader, Panel, StatCard } from "@/components/common/page";
import { SearchInput, SortHeader, TablePagination, useSortPage } from "@/components/common/table-tools";
import { SourceBadge, StatusBadge } from "@/components/common/badges";
import { Field } from "@/components/appointments/appointment-form-dialog";
import { patientService, useClinic } from "@/services/demo/store";
import { formatDate, formatTime12, initials } from "@/lib/format";
import type { Appointment, Patient } from "@/types/clinic";

export const Route = createFileRoute("/patients")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Patients — Arovia Healthcare Dashboard" },
      { name: "description", content: "Manage Arovia Clinic patient records and visit history." },
      { property: "og:title", content: "Patients — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Manage Arovia Clinic patient records and visit history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PatientsPage,
});

function PatientsPage() {
  const search = Route.useSearch();
  const patients = useClinic((s) => s.patients);
  const appointments = useClinic((s) => s.appointments);
  const [q, setQ] = useState(search.q ?? "");
  const [source, setSource] = useState("all");
  const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState<Patient | "new" | null>(null);

  useEffect(() => {
    if (search.q) setQ(search.q);
  }, [search.q]);

  const stats = useMemo(() => {
    const byPatient = new Map<string, { total: number; last?: string }>();
    const today = format(new Date(), "yyyy-MM-dd");
    for (const a of appointments) {
      const cur = byPatient.get(a.patientId) ?? { total: 0 };
      cur.total++;
      if (a.status === "completed" && a.date <= today && (!cur.last || a.date > cur.last)) cur.last = a.date;
      byPatient.set(a.patientId, cur);
    }
    return byPatient;
  }, [appointments]);

  const month = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const newCount = patients.filter((p) => p.registeredAt.slice(0, 10) >= month).length;
  const returning = [...stats.values()].filter((s) => s.total > 1).length;

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients.filter(
      (p) =>
        (source === "all" || p.source === source) &&
        (!term || `${p.id} ${p.name} ${p.phone} ${p.email ?? ""}`.toLowerCase().includes(term)),
    );
  }, [patients, q, source]);

  const t = useSortPage(
    rows,
    {
      id: (p) => p.id,
      name: (p) => p.name,
      age: (p) => p.age,
      total: (p) => stats.get(p.id)?.total ?? 0,
      last: (p) => stats.get(p.id)?.last ?? "",
      registered: (p) => p.registeredAt,
    },
    { key: "registered", dir: "desc" },
  );
  const sh = { sort: t.sort, onToggle: t.toggle };

  return (
    <PageContainer>
      <PageHeader
        title="Patients"
        subtitle="Manage your clinic's patient records."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="size-3.5" /> Add patient
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total patients" value={patients.length} icon={Users} />
        <StatCard label="New this month" value={newCount} icon={UserPlus} hint="last 30 days" />
        <StatCard label="Returning patients" value={returning} icon={UserRoundCheck} hint="2+ appointments" />
      </div>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, email or ID" className="w-full sm:w-72" />
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="whatsapp">Registered via WhatsApp</SelectItem>
              <SelectItem value="admin">Added by admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No patients match" description="Try another name or phone number." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs hover:bg-transparent">
                    <TableHead className="pl-5"><SortHeader label="ID" k="id" {...sh} /></TableHead>
                    <TableHead><SortHeader label="Name" k="name" {...sh} /></TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead><SortHeader label="Age" k="age" {...sh} /></TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead><SortHeader label="Appointments" k="total" {...sh} /></TableHead>
                    <TableHead><SortHeader label="Last visit" k="last" {...sh} /></TableHead>
                    <TableHead><SortHeader label="Registered" k="registered" {...sh} /></TableHead>
                    <TableHead className="pr-5"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {t.pageRows.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer text-sm" onClick={() => setViewing(p.id)}>
                      <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-7 place-items-center rounded-full bg-teal-soft text-[11px] font-semibold text-teal-soft-foreground">
                            {initials(p.name)}
                          </span>
                          <span className="font-medium whitespace-nowrap">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{p.phone}</TableCell>
                      <TableCell className="tabular-nums">{p.age}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{stats.get(p.id)?.total ?? 0}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {stats.get(p.id)?.last ? formatDate(stats.get(p.id)!.last!) : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(p.registeredAt)}</TableCell>
                      <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-8" aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination page={t.page} pageCount={t.pageCount} total={t.total} pageSize={t.pageSize} onPage={t.setPage} />
          </>
        )}
      </Panel>

      <PatientDrawer id={viewing} onClose={() => setViewing(null)} onEdit={(p) => setEditing(p)} />
      <PatientFormDialog
        open={editing !== null}
        patient={editing && editing !== "new" ? editing : undefined}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </PageContainer>
  );
}

function PatientDrawer({ id, onClose, onEdit }: { id: string | null; onClose: () => void; onEdit: (p: Patient) => void }) {
  const patient = useClinic((s) => s.patients.find((p) => p.id === id));
  const appointments = useClinic((s) => s.appointments);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const conversations = useClinic((s) => s.conversations);
  const today = format(new Date(), "yyyy-MM-dd");
  const mine = appointments.filter((a) => a.patientId === id);
  const upcoming = mine.filter((a) => a.date >= today && (a.status === "confirmed" || a.status === "pending"));
  const history = mine.filter((a) => !upcoming.includes(a)).sort((a, b) => b.date.localeCompare(a.date));
  const convo = conversations.find((c) => c.patientId === id);
  const name = (list: { id: string; name: string }[], x: string) => list.find((l) => l.id === x)?.name;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {patient && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-teal-soft text-base font-semibold text-teal-soft-foreground">
                  {initials(patient.name)}
                </span>
                <div>
                  <SheetTitle>{patient.name}</SheetTitle>
                  <SheetDescription>
                    {patient.id} · {patient.age} yrs
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="mt-6 space-y-6 text-sm">
              <section className="space-y-1.5 rounded-lg border p-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span>{patient.phone}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span>{patient.email ?? "—"}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registered</span>{formatDate(patient.registeredAt)}</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Source</span><SourceBadge source={patient.source} /></div>
              </section>
              <ApptList title="Upcoming" items={upcoming} doctors={doctors} services={services} name={name} />
              <ApptList title="Appointment history" items={history.slice(0, 8)} doctors={doctors} services={services} name={name} />
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Conversation</h3>
                {convo ? (
                  <div className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-muted-foreground">“{convo.messages.filter((m) => m.text).at(-1)?.text}”</p>
                    <Button asChild variant="link" size="sm" className="mt-1 h-auto px-0">
                      <Link to="/conversations" search={{ id: convo.id }}><MessageCircle className="size-3.5" /> Open conversation</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No WhatsApp conversation yet.</p>
                )}
              </section>
              <Button variant="outline" className="w-full" onClick={() => onEdit(patient)}>
                <Pencil className="size-3.5" /> Edit patient
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ApptList({
  title,
  items,
  doctors,
  services,
  name,
}: {
  title: string;
  items: Appointment[];
  doctors: { id: string; name: string }[];
  services: { id: string; name: string }[];
  name: (l: { id: string; name: string }[], id: string) => string | undefined;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      {items.length === 0 ? (
        <p className="text-muted-foreground">None.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{name(services, a.serviceId)}</div>
                <div className="text-xs text-muted-foreground">
                  {format(parseISO(a.date), "dd MMM yyyy")} · {formatTime12(a.time)} · {name(doctors, a.doctorId)}
                </div>
              </div>
              <StatusBadge status={a.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const patientSchema = z.object({
  name: z.string().trim().min(2, "Enter the full name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{10,16}$/, "Enter a valid phone number"),
  age: z.coerce.number().int().min(0, "Invalid age").max(120, "Invalid age"),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
});
type PatientForm = z.infer<typeof patientSchema>;

function PatientFormDialog({
  open,
  onOpenChange,
  patient,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  patient?: Patient | undefined;
}) {
  const { register, handleSubmit, reset, formState } = useForm<PatientForm>({ resolver: zodResolver(patientSchema) });
  useEffect(() => {
    if (open) reset(patient ? { name: patient.name, phone: patient.phone, age: patient.age, email: patient.email ?? "" } : { name: "", phone: "+91 ", age: undefined as unknown as number, email: "" });
  }, [open, patient, reset]);

  const onSubmit = (v: PatientForm) => {
    const data = { ...v, email: v.email || undefined };
    if (patient) {
      patientService.update(patient.id, data);
      toast.success("Patient updated");
    } else {
      const p = patientService.create({ ...data, source: "admin" });
      toast.success(`${p.name} added as ${p.id}`);
    }
    onOpenChange(false);
  };
  const e = formState.errors;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{patient ? "Edit patient" : "Add patient"}</DialogTitle>
          <DialogDescription>Patient details are visible only to clinic staff.</DialogDescription>
        </DialogHeader>
        <form id="patient-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" error={e.name?.message} className="sm:col-span-2"><Input {...register("name")} /></Field>
          <Field label="Phone" error={e.phone?.message}><Input {...register("phone")} /></Field>
          <Field label="Age" error={e.age?.message}><Input type="number" {...register("age")} /></Field>
          <Field label="Email (optional)" error={e.email?.message} className="sm:col-span-2"><Input type="email" {...register("email")} /></Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="patient-form">{patient ? "Save changes" : "Add patient"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
