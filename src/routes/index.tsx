import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, formatDistanceToNow, isToday, parseISO, subDays } from "date-fns";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, Panel, StatCard } from "@/components/common/page";
import { SearchInput } from "@/components/common/table-tools";
import { AppointmentActionsProvider, useAppointmentActions } from "@/components/appointments/appointment-actions";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { AssistantStatus } from "@/components/overview/assistant-status";
import { useClinic } from "@/services/demo/store";
import { dailyTrend, pctChange, summarize } from "@/services/analytics";
import type { ActivityItem, AppointmentStatus } from "@/types/clinic";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Overview — Arovia Healthcare Dashboard" },
      { name: "description", content: "Today's appointments, patients and AI receptionist activity at Arovia Clinic." },
      { property: "og:title", content: "Overview — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Today's appointments, patients and AI receptionist activity at Arovia Clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppointmentActionsProvider>
      <Overview />
    </AppointmentActionsProvider>
  ),
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const activityIcon: Record<ActivityItem["type"], typeof Plus> = {
  booked: CalendarPlus,
  registered: UserPlus,
  rescheduled: RefreshCw,
  cancelled: XCircle,
  completed: CheckCircle2,
};

function Overview() {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const activity = useClinic((s) => s.activity);
  const adminName = useClinic((s) => s.settings.adminName);
  const { create } = useAppointmentActions();

  const [date, setDate] = useState<Date>(new Date());
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [hello, setHello] = useState("Hello");
  useEffect(() => setHello(greeting()), []);

  const day = format(date, "yyyy-MM-dd");
  const kpis = useMemo(() => {
    const now = new Date();
    const d30 = format(subDays(now, 29), "yyyy-MM-dd");
    const d60 = format(subDays(now, 59), "yyyy-MM-dd");
    const todayStr = format(now, "yyyy-MM-dd");
    const last30 = summarize(appointments.filter((a) => a.date >= d30 && a.date <= todayStr));
    const prev30 = summarize(appointments.filter((a) => a.date >= d60 && a.date < d30));
    const sameDayLastWeek = format(subDays(date, 7), "yyyy-MM-dd");
    const dayCount = appointments.filter((a) => a.date === day).length;
    const lastWeekCount = appointments.filter((a) => a.date === sameDayLastWeek).length;
    const upcoming = appointments.filter(
      (a) => a.date > todayStr && (a.status === "confirmed" || a.status === "pending"),
    ).length;
    const newThisMonth = patients.filter((p) => p.registeredAt.slice(0, 10) >= d30).length;
    return {
      dayCount,
      dayChange: pctChange(dayCount, lastWeekCount),
      upcoming,
      completed: last30.completed,
      completedChange: pctChange(last30.completed, prev30.completed),
      cancelled: last30.cancelled,
      cancelledChange: pctChange(last30.cancelled, prev30.cancelled),
      newThisMonth,
    };
  }, [appointments, patients, date, day]);

  const dayRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const pmap = new Map(patients.map((p) => [p.id, p.name.toLowerCase()]));
    return appointments.filter(
      (a) =>
        a.date === day &&
        (status === "all" || a.status === status) &&
        (!term || pmap.get(a.patientId)?.includes(term)),
    );
  }, [appointments, patients, day, q, status]);

  const trend = useMemo(() => {
    const now = new Date();
    return range === "weekly"
      ? dailyTrend(appointments, subDays(now, 3), addDays(now, 3))
      : dailyTrend(appointments, subDays(now, 29), now);
  }, [appointments, range]);

  return (
    <PageContainer>
      <PageHeader
        title={`${hello}, ${adminName}`}
        subtitle="Here's what's happening at Arovia Clinic today."
        actions={
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarDays className="size-3.5" />
                  {isToday(date) ? `Today, ${format(date, "dd MMM")}` : format(date, "EEE, dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={create}>
              <Plus className="size-3.5" /> New Appointment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label={isToday(date) ? "Today's Appointments" : `Appointments · ${format(date, "dd MMM")}`}
          value={kpis.dayCount}
          icon={CalendarDays}
          change={kpis.dayChange}
          hint="vs same day last week"
        />
        <StatCard label="Total Patients" value={patients.length} icon={Users} hint={`${kpis.newThisMonth} new in 30 days`} />
        <StatCard label="Upcoming Appointments" value={kpis.upcoming} icon={CalendarClock} hint="after today" />
        <StatCard label="Completed" value={kpis.completed} icon={CalendarCheck2} change={kpis.completedChange} hint="last 30 days" />
        <StatCard label="Cancelled" value={kpis.cancelled} icon={CalendarX2} change={kpis.cancelledChange} hint="last 30 days" />
      </div>

      <Panel
        title={isToday(date) ? "Today's appointments" : `Appointments on ${format(date, "dd MMM yyyy")}`}
        description={`${dayRows.length} scheduled`}
        bodyClassName="p-0"
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search patient" className="w-40 sm:w-52" />
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no-show">No-show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <AppointmentsTable
          rows={dayRows}
          variant="today"
          pageSize={6}
          emptyAction={<Button size="sm" onClick={create}><Plus className="size-3.5" /> New Appointment</Button>}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Appointment analytics"
          description={range === "weekly" ? "This week, by day" : "Last 30 days"}
          actions={
            <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="booked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="booked" name="Booked" stroke="var(--teal)" strokeWidth={2} fill="url(#booked)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--primary)" strokeWidth={1.5} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <div className="space-y-6">
          <AssistantStatus />
          <Panel title="Recent activity" bodyClassName="py-2">
            <ul className="divide-y">
              {activity.slice(0, 5).map((a) => {
                const Icon = activityIcon[a.type];
                return (
                  <li key={a.id} className="flex gap-3 py-2.5">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(parseISO(a.at), { addSuffix: true })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>
      </div>
    </PageContainer>
  );
}
