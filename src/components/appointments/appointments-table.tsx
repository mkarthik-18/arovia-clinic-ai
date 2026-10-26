import { useMemo } from "react";
import { CalendarX2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SourceBadge, StatusBadge } from "@/components/common/badges";
import { EmptyState } from "@/components/common/page";
import { SortHeader, TablePagination, useSortPage } from "@/components/common/table-tools";
import { AppointmentRowMenu, useAppointmentActions } from "./appointment-actions";
import { useClinic } from "@/services/demo/store";
import { formatDate, formatTime12, initials } from "@/lib/format";
import type { Appointment } from "@/types/clinic";

export function AppointmentsTable({
  rows,
  variant = "full",
  pageSize = 10,
  emptyAction,
}: {
  rows: Appointment[];
  variant?: "full" | "today";
  pageSize?: number;
  emptyAction?: React.ReactNode;
}) {
  const patients = useClinic((s) => s.patients);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const { view } = useAppointmentActions();

  const lookup = useMemo(
    () => ({
      p: new Map(patients.map((x) => [x.id, x])),
      d: new Map(doctors.map((x) => [x.id, x])),
      s: new Map(services.map((x) => [x.id, x])),
    }),
    [patients, doctors, services],
  );

  const t = useSortPage(
    rows,
    {
      id: (a) => a.id,
      patient: (a) => lookup.p.get(a.patientId)?.name ?? "",
      doctor: (a) => lookup.d.get(a.doctorId)?.name ?? "",
      when: (a) => a.date + a.time,
      status: (a) => a.status,
    },
    { key: "when", dir: variant === "today" ? "asc" : "desc" },
    pageSize,
  );

  if (!rows.length) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="No appointments found"
        description="Try a different filter, or create an appointment for a patient."
        action={emptyAction}
      />
    );
  }

  const full = variant === "full";
  const sh = { sort: t.sort, onToggle: t.toggle };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs hover:bg-transparent">
              {full && <TableHead className="pl-5"><SortHeader label="ID" k="id" {...sh} /></TableHead>}
              <TableHead className={full ? "" : "pl-5"}><SortHeader label="Patient" k="patient" {...sh} /></TableHead>
              {full && <TableHead>Phone</TableHead>}
              <TableHead><SortHeader label="Doctor" k="doctor" {...sh} /></TableHead>
              <TableHead>Service</TableHead>
              <TableHead><SortHeader label={full ? "Date & time" : "Time"} k="when" {...sh} /></TableHead>
              <TableHead>Source</TableHead>
              <TableHead><SortHeader label="Status" k="status" {...sh} /></TableHead>
              <TableHead className="w-12 pr-5"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {t.pageRows.map((a) => {
              const p = lookup.p.get(a.patientId);
              return (
                <TableRow key={a.id} className="cursor-pointer text-sm" onClick={() => view(a)}>
                  {full && <TableCell className="pl-5 font-mono text-xs text-muted-foreground">{a.id}</TableCell>}
                  <TableCell className={full ? "" : "pl-5"}>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                        {initials(p?.name ?? "?")}
                      </span>
                      <span className="font-medium whitespace-nowrap text-foreground">{p?.name}</span>
                    </div>
                  </TableCell>
                  {full && <TableCell className="whitespace-nowrap text-muted-foreground">{p?.phone}</TableCell>}
                  <TableCell className="whitespace-nowrap">{lookup.d.get(a.doctorId)?.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{lookup.s.get(a.serviceId)?.name}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {full && <span className="text-muted-foreground">{formatDate(a.date)} · </span>}
                    {formatTime12(a.time)}
                  </TableCell>
                  <TableCell><SourceBadge source={a.source} /></TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell className="pr-5" onClick={(e) => e.stopPropagation()}>
                    <AppointmentRowMenu appointment={a} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TablePagination page={t.page} pageCount={t.pageCount} total={t.total} pageSize={t.pageSize} onPage={t.setPage} />
    </>
  );
}
