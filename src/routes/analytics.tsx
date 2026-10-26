import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO, subDays } from "date-fns";
import { CalendarCheck2, CalendarDays, CalendarX2, MessageCircle, UserPlus, UserRoundCheck, UserX } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer, PageHeader, Panel, StatCard } from "@/components/common/page";
import { useClinic } from "@/services/demo/store";
import { byDoctor, byService, dailyTrend, patientMix, summarize } from "@/services/analytics";

export const Route = createFileRoute("/analytics")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Analytics — Arovia Healthcare Dashboard" },
      { name: "description", content: "Appointment trends, booking sources and doctor performance at Arovia Clinic." },
      { property: "og:title", content: "Analytics — Arovia Healthcare Dashboard" },
      { property: "og:description", content: "Appointment trends, booking sources and doctor performance at Arovia Clinic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

type Preset = "today" | "7" | "30" | "90" | "custom";
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };
const axis = { tickLine: false, axisLine: false, fontSize: 11, stroke: "var(--muted-foreground)" } as const;
const STATUS_COLORS: Record<string, string> = {
  Completed: "var(--info)",
  Confirmed: "var(--success)",
  Pending: "var(--warning)",
  Cancelled: "var(--danger)",
  "No-show": "var(--neutral)",
};

function AnalyticsPage() {
  const appointments = useClinic((s) => s.appointments);
  const patients = useClinic((s) => s.patients);
  const services = useClinic((s) => s.services);
  const doctors = useClinic((s) => s.doctors);
  const [preset, setPreset] = useState<Preset>("30");
  const today = format(new Date(), "yyyy-MM-dd");
  const [customFrom, setCustomFrom] = useState(format(subDays(new Date(), 13), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(today);

  const [from, to] = useMemo(() => {
    if (preset === "custom") return customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
    if (preset === "today") return [today, today];
    return [format(subDays(new Date(), Number(preset) - 1), "yyyy-MM-dd"), today];
  }, [preset, customFrom, customTo, today]);

  const data = useMemo(() => {
    const scoped = appointments.filter((a) => a.date >= from && a.date <= to);
    const s = summarize(scoped);
    return {
      s,
      mix: patientMix(patients, scoped, from, to),
      trend: dailyTrend(scoped, parseISO(from), parseISO(to)),
      services: byService(scoped, services).slice(0, 6),
      doctors: byDoctor(scoped, doctors),
      sources: [
        { name: "WhatsApp", value: scoped.filter((a) => a.source === "whatsapp").length },
        { name: "Admin", value: scoped.filter((a) => a.source === "admin").length },
      ],
      statuses: [
        { name: "Completed", value: s.completed },
        { name: "Confirmed", value: s.confirmed },
        { name: "Pending", value: s.pending },
        { name: "Cancelled", value: s.cancelled },
        { name: "No-show", value: s.noShow },
      ].filter((x) => x.value > 0),
    };
  }, [appointments, patients, services, doctors, from, to]);

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        subtitle="How Arovia Clinic and Arovia Assistant are performing."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={preset} onValueChange={(v) => setPreset(v as Preset)}>
              <TabsList className="h-8">
                <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
                <TabsTrigger value="7" className="text-xs">7 days</TabsTrigger>
                <TabsTrigger value="30" className="text-xs">30 days</TabsTrigger>
                <TabsTrigger value="90" className="text-xs">90 days</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
            {preset === "custom" && (
              <div className="flex items-center gap-1">
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 w-36 text-xs" aria-label="From" />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 w-36 text-xs" aria-label="To" />
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total appointments" value={data.s.total} icon={CalendarDays} />
        <StatCard label="Completed" value={data.s.completed} icon={CalendarCheck2} />
        <StatCard label="Cancelled" value={data.s.cancelled} icon={CalendarX2} />
        <StatCard label="No-show rate" value={`${data.s.noShowRate}%`} icon={UserX} hint="of attended + missed" />
        <StatCard label="New patients" value={data.mix.newPatients} icon={UserPlus} />
        <StatCard label="Returning patients" value={data.mix.returning} icon={UserRoundCheck} hint="2+ visits in range" />
        <StatCard label="WhatsApp bookings" value={`${data.s.whatsappPct}%`} icon={MessageCircle} />
        <StatCard label="Admin bookings" value={`${data.s.adminPct}%`} icon={CalendarDays} />
      </div>

      <Panel title="Appointment trends" description={`${format(parseISO(from), "dd MMM")} – ${format(parseISO(to), "dd MMM yyyy")}`}>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" {...axis} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} {...axis} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="booked" name="Booked" stroke="var(--teal)" fill="var(--teal)" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--primary)" fill="transparent" strokeWidth={1.5} />
              <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="var(--danger)" fill="transparent" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Popular services">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.services} layout="vertical" margin={{ left: 40, right: 16 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis type="category" dataKey="name" width={140} {...axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" name="Appointments" fill="var(--teal)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Doctor performance">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.doctors} margin={{ left: -20, right: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" name="Completed" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="cancelled" name="Cancelled / no-show" fill="var(--chart-3)" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Booking sources">
          <DonutChart data={data.sources} colors={["var(--teal)", "var(--primary)"]} />
        </Panel>
        <Panel title="Appointment status distribution">
          <DonutChart data={data.statuses} colors={data.statuses.map((s) => STATUS_COLORS[s.name] ?? "var(--neutral)")} />
        </Panel>
      </div>
    </PageContainer>
  );
}

function DonutChart({ data, colors }: { data: { name: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((n, d) => n + d.value, 0);
  if (!total) return <p className="py-16 text-center text-sm text-muted-foreground">No appointments in this range.</p>;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: colors[i] }} />{d.name}</span>
            <span className="tabular-nums text-muted-foreground">{d.value} · {Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
