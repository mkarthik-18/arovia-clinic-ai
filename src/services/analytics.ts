import { eachDayOfInterval, format, parseISO } from "date-fns";
import type { Appointment, Doctor, Patient, Service } from "@/types/clinic";

export function inRange(a: Appointment, from: string, to: string) {
  return a.date >= from && a.date <= to;
}

export function summarize(appts: Appointment[]) {
  const by = (s: Appointment["status"]) => appts.filter((a) => a.status === s).length;
  const total = appts.length;
  const whatsapp = appts.filter((a) => a.source === "whatsapp").length;
  const noShow = by("no-show");
  const attendedOrMissed = by("completed") + noShow;
  return {
    total,
    confirmed: by("confirmed"),
    pending: by("pending"),
    completed: by("completed"),
    cancelled: by("cancelled"),
    noShow,
    noShowRate: attendedOrMissed ? Math.round((noShow / attendedOrMissed) * 100) : 0,
    whatsappPct: total ? Math.round((whatsapp / total) * 100) : 0,
    adminPct: total ? 100 - Math.round((whatsapp / total) * 100) : 0,
  };
}

export function pctChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function dailyTrend(appts: Appointment[], from: Date, to: Date) {
  const days = eachDayOfInterval({ start: from, end: to });
  const buckets = new Map(days.map((d) => [format(d, "yyyy-MM-dd"), { booked: 0, completed: 0, cancelled: 0 }]));
  for (const a of appts) {
    const b = buckets.get(a.date);
    if (!b) continue;
    b.booked++;
    if (a.status === "completed") b.completed++;
    if (a.status === "cancelled") b.cancelled++;
  }
  const long = days.length > 10;
  return [...buckets.entries()].map(([date, v]) => ({
    label: format(parseISO(date), long ? "dd MMM" : "EEE"),
    ...v,
  }));
}

export function byService(appts: Appointment[], services: Service[]) {
  return services
    .map((s) => ({ name: s.name, value: appts.filter((a) => a.serviceId === s.id).length }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function byDoctor(appts: Appointment[], doctors: Doctor[]) {
  return doctors
    .map((d) => {
      const mine = appts.filter((a) => a.doctorId === d.id);
      return {
        name: d.name.replace("Dr. ", "Dr. "),
        total: mine.length,
        completed: mine.filter((a) => a.status === "completed").length,
        cancelled: mine.filter((a) => a.status === "cancelled" || a.status === "no-show").length,
      };
    })
    .filter((x) => x.total > 0);
}

export function patientMix(patients: Patient[], appts: Appointment[], from: string, to: string) {
  const newPatients = patients.filter((p) => {
    const d = p.registeredAt.slice(0, 10);
    return d >= from && d <= to;
  }).length;
  const counts = new Map<string, number>();
  for (const a of appts) counts.set(a.patientId, (counts.get(a.patientId) ?? 0) + 1);
  const returning = [...counts.values()].filter((c) => c > 1).length;
  return { newPatients, returning };
}
