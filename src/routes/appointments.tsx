import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, Panel } from "@/components/common/page";
import { SearchInput } from "@/components/common/table-tools";
import { AppointmentActionsProvider, useAppointmentActions } from "@/components/appointments/appointment-actions";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { useClinic } from "@/services/demo/store";
import { downloadCsv, formatTime12 } from "@/lib/format";

export const Route = createFileRoute("/appointments")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Appointments — Arovia Healthcare Dashboard" },
      { name: "description", content: "Manage and track all Arovia Clinic appointments." },
      { property: "og:title", content: "Appointments — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Manage and track all Arovia Clinic appointments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppointmentActionsProvider>
      <AppointmentsPage />
    </AppointmentActionsProvider>
  ),
});

type Tab = "all" | "today" | "upcoming" | "completed" | "cancelled";

function AppointmentsPage() {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const { create } = useAppointmentActions();

  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [doctor, setDoctor] = useState("all");
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");

  const today = format(new Date(), "yyyy-MM-dd");
  const pmap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return appointments.filter((a) => {
      if (tab === "today" && a.date !== today) return false;
      if (tab === "upcoming" && !(a.date > today && (a.status === "confirmed" || a.status === "pending"))) return false;
      if (tab === "completed" && a.status !== "completed") return false;
      if (tab === "cancelled" && a.status !== "cancelled") return false;
      if (from && a.date < from) return false;
      if (to && a.date > to) return false;
      if (doctor !== "all" && a.doctorId !== doctor) return false;
      if (service !== "all" && a.serviceId !== service) return false;
      if (status !== "all" && a.status !== status) return false;
      if (source !== "all" && a.source !== source) return false;
      if (term) {
        const p = pmap.get(a.patientId);
        if (!`${a.id} ${p?.name} ${p?.phone}`.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [appointments, tab, today, from, to, doctor, service, status, source, q, pmap]);

  const filtersActive = from || to || doctor !== "all" || service !== "all" || status !== "all" || source !== "all" || q;

  const exportCsv = () => {
    const dmap = new Map(doctors.map((d) => [d.id, d.name]));
    const smap = new Map(services.map((s) => [s.id, s.name]));
    downloadCsv(`arovia-appointments-${today}.csv`, [
      ["Appointment ID", "Patient", "Phone", "Doctor", "Service", "Date", "Time", "Status", "Source"],
      ...rows.map((a) => [
        a.id,
        pmap.get(a.patientId)?.name ?? "",
        pmap.get(a.patientId)?.phone ?? "",
        dmap.get(a.doctorId) ?? "",
        smap.get(a.serviceId) ?? "",
        a.date,
        formatTime12(a.time),
        a.status,
        a.source,
      ]),
    ]);
    toast.success(`Exported ${rows.length} appointments`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Appointments"
        subtitle="Manage and track all clinic appointments."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
              <Download className="size-3.5" /> Export CSV
            </Button>
            <Button size="sm" onClick={create}>
              <Plus className="size-3.5" /> New Appointment
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search ID, patient or phone" className="w-full sm:w-60" />
          <div className="flex items-center gap-1">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 w-36 text-xs" aria-label="From date" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 w-36 text-xs" aria-label="To date" />
          </div>
          <FilterSelect value={doctor} onChange={setDoctor} label="All doctors" options={doctors.map((d) => [d.id, d.name])} />
          <FilterSelect value={service} onChange={setService} label="All services" options={services.map((s) => [s.id, s.name])} />
          <FilterSelect
            value={status}
            onChange={setStatus}
            label="All statuses"
            options={[["confirmed", "Confirmed"], ["pending", "Pending"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["no-show", "No-show"]]}
          />
          <FilterSelect value={source} onChange={setSource} label="All sources" options={[["whatsapp", "WhatsApp"], ["admin", "Admin"]]} />
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setQ(""); setFrom(""); setTo(""); setDoctor("all"); setService("all"); setStatus("all"); setSource("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <AppointmentsTable rows={rows} />
      </Panel>
    </PageContainer>
  );
}

export function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-32 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
