import type { Appointment, BlockedDate, ClinicSchedule, Doctor } from "@/types/clinic";

export function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Weekday (0 = Sunday) for a "yyyy-MM-dd" string, timezone-independent. */
export function weekdayOf(date: string): number {
  const [y = 1970, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** All slot start times the clinic offers on a given date, ignoring bookings. */
export function clinicSlotsForDate(
  date: string,
  schedule: ClinicSchedule,
  blocked: BlockedDate[] = [],
  doctor?: Doctor,
): string[] {
  const day = schedule.week.find((d) => d.day === weekdayOf(date));
  if (!day || !day.open) return [];
  if (blocked.some((b) => b.date === date && (!b.doctorId || b.doctorId === doctor?.id))) return [];
  if (doctor && (!doctor.active || !doctor.workingDays.includes(weekdayOf(date)))) return [];

  const step = doctor?.slotMinutes ?? schedule.slotMinutes;
  const slots: string[] = [];
  for (const session of day.sessions) {
    let start = toMinutes(session.start);
    let end = toMinutes(session.end);
    if (doctor) {
      start = Math.max(start, toMinutes(doctor.startTime));
      end = Math.min(end, toMinutes(doctor.endTime));
    }
    for (let t = start; t + step <= end; t += step) slots.push(fromMinutes(t));
  }
  return slots;
}

const ACTIVE_STATUSES = new Set(["confirmed", "pending"]);

/** True when another non-cancelled appointment already holds this doctor's slot. */
export function isDoubleBooked(
  candidate: Pick<Appointment, "doctorId" | "date" | "time"> & { id?: string },
  existing: Appointment[],
  maxPerSlot = 1,
): boolean {
  const taken = existing.filter(
    (a) =>
      a.id !== candidate.id &&
      a.doctorId === candidate.doctorId &&
      a.date === candidate.date &&
      a.time === candidate.time &&
      ACTIVE_STATUSES.has(a.status),
  ).length;
  return taken >= maxPerSlot;
}

/** Slots still bookable for a doctor on a date. */
export function availableSlots(
  date: string,
  doctor: Doctor,
  schedule: ClinicSchedule,
  blocked: BlockedDate[],
  appointments: Appointment[],
): string[] {
  return clinicSlotsForDate(date, schedule, blocked, doctor).filter(
    (time) => !isDoubleBooked({ doctorId: doctor.id, date, time }, appointments, schedule.maxPerSlot),
  );
}
