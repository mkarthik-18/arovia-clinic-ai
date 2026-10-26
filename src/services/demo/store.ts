/**
 * DEMO DATA SERVICE.
 * In-memory store backed by sample records. Changes last until the page reloads.
 * A future secure backend can replace this module while preserving the same API.
 */
import { useSyncExternalStore } from "react";
import type {
  ActivityItem,
  Appointment,
  AppointmentStatus,
  BlockedDate,
  ClinicSchedule,
  ClinicSettings,
  Conversation,
  Doctor,
  Patient,
  Service,
} from "@/types/clinic";
import { isDoubleBooked } from "@/lib/scheduling";
import { buildSeed } from "./seed";

export type ClinicState = ReturnType<typeof buildSeed>;

let state: ClinicState = buildSeed();
const listeners = new Set<() => void>();

function set(updater: (s: ClinicState) => Partial<ClinicState>) {
  state = { ...state, ...updater(state) };
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function resetDemoData() {
  state = buildSeed();
  listeners.forEach((l) => l());
}

export function useClinic<T>(selector: (s: ClinicState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(state),
  );
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

function log(type: ActivityItem["type"], text: string): ActivityItem {
  return { id: uid("act"), type, text, at: new Date().toISOString() };
}

export class BookingConflictError extends Error {
  constructor() {
    super("This doctor already has an appointment at that time.");
  }
}

type AppointmentInput = Omit<Appointment, "id" | "createdAt">;

export const appointmentService = {
  create(input: AppointmentInput): Appointment {
    if (isDoubleBooked(input, state.appointments, state.schedule.maxPerSlot)) throw new BookingConflictError();
    const nextNum =
      Math.max(2400, ...state.appointments.map((a) => Number(a.id.replace("APT-", "")) || 0)) + 1;
    const appt: Appointment = { ...input, id: `APT-${nextNum}`, createdAt: new Date().toISOString() };
    const patient = state.patients.find((p) => p.id === input.patientId);
    set((s) => ({
      appointments: [...s.appointments, appt],
      activity: [log("booked", `${patient?.name ?? "Patient"} booked an appointment`), ...s.activity],
    }));
    return appt;
  },
  update(id: string, patch: Partial<AppointmentInput>) {
    const current = state.appointments.find((a) => a.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    if (
      (patch.date || patch.time || patch.doctorId) &&
      isDoubleBooked(next, state.appointments, state.schedule.maxPerSlot)
    )
      throw new BookingConflictError();
    const patient = state.patients.find((p) => p.id === next.patientId);
    const rescheduled = patch.date !== undefined && (patch.date !== current.date || patch.time !== current.time);
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? next : a)),
      activity: rescheduled
        ? [log("rescheduled", `${patient?.name ?? "Patient"} was rescheduled`), ...s.activity]
        : s.activity,
    }));
  },
  setStatus(id: string, status: AppointmentStatus) {
    const appt = state.appointments.find((a) => a.id === id);
    const patient = state.patients.find((p) => p.id === appt?.patientId);
    const type = status === "cancelled" ? "cancelled" : status === "completed" ? "completed" : null;
    set((s) => ({
      appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
      activity: type
        ? [log(type, `${patient?.name ?? "Patient"}'s appointment marked ${status}`), ...s.activity]
        : s.activity,
    }));
  },
};

export const patientService = {
  create(input: Omit<Patient, "id" | "registeredAt">): Patient {
    const nextNum = Math.max(1000, ...state.patients.map((p) => Number(p.id.replace("PT-", "")) || 0)) + 1;
    const patient: Patient = { ...input, id: `PT-${nextNum}`, registeredAt: new Date().toISOString() };
    set((s) => ({
      patients: [patient, ...s.patients],
      activity: [log("registered", `${patient.name} registered as a new patient`), ...s.activity],
    }));
    return patient;
  },
  update(id: string, patch: Partial<Patient>) {
    set((s) => ({ patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  },
};

export const doctorService = {
  create(input: Omit<Doctor, "id">) {
    set((s) => ({ doctors: [...s.doctors, { ...input, id: uid("doc") }] }));
  },
  update(id: string, patch: Partial<Doctor>) {
    set((s) => ({ doctors: s.doctors.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
  },
};

export const serviceService = {
  create(input: Omit<Service, "id">) {
    set((s) => ({ services: [...s.services, { ...input, id: uid("svc") }] }));
  },
  update(id: string, patch: Partial<Service>) {
    set((s) => ({ services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
};

export const availabilityService = {
  updateSchedule(schedule: ClinicSchedule) {
    set(() => ({ schedule }));
  },
  addBlocked(input: Omit<BlockedDate, "id">) {
    set((s) => ({ blocked: [...s.blocked, { ...input, id: uid("blk") }] }));
  },
  removeBlocked(id: string) {
    set((s) => ({ blocked: s.blocked.filter((b) => b.id !== id) }));
  },
};

export const conversationService = {
  markRead(id: string) {
    set((s) => ({
      conversations: s.conversations.map((c: Conversation) => (c.id === id ? { ...c, unread: 0 } : c)),
    }));
  },
  setStatus(id: string, status: Conversation["status"]) {
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, status } : c)) }));
  },
};

export const settingsService = {
  update(patch: Partial<ClinicSettings>) {
    set((s) => ({ settings: { ...s.settings, ...patch } }));
  },
};
