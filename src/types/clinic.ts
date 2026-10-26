export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed" | "no-show";
export type BookingSource = "whatsapp" | "admin";

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  /** 0 = Sunday … 6 = Saturday */
  workingDays: number[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  slotMinutes: number;
  active: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price?: number | undefined;
  doctorIds: string[];
  active: boolean;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  email?: string | undefined;
  registeredAt: string; // ISO
  source: BookingSource;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  date: string; // "yyyy-MM-dd"
  time: string; // "HH:mm"
  status: AppointmentStatus;
  source: BookingSource;
  notes?: string | undefined;
  createdAt: string; // ISO
}

export interface Message {
  id: string;
  from: "patient" | "assistant";
  text: string;
  at: string; // ISO
  kind?: "text" | "booking" | undefined;
  appointmentId?: string | undefined;
}

export type ConversationStatus = "active" | "booked" | "needs-attention" | "closed";

export interface Conversation {
  id: string;
  patientId: string;
  status: ConversationStatus;
  unread: number;
  messages: Message[];
}

export interface TimeRange {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface DaySchedule {
  day: number; // 0 = Sunday
  open: boolean;
  sessions: TimeRange[];
}

export interface BlockedDate {
  id: string;
  date: string; // "yyyy-MM-dd"
  reason: string;
  doctorId?: string | undefined; // undefined = whole clinic
}

export interface ClinicSchedule {
  week: DaySchedule[];
  slotMinutes: number;
  maxPerSlot: number;
}

export interface ActivityItem {
  id: string;
  type: "booked" | "registered" | "rescheduled" | "cancelled" | "completed";
  text: string;
  at: string; // ISO
}

export interface ClinicSettings {
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  mapsUrl: string;
  timeZone: string;
  assistantName: string;
  welcomeMessage: string;
  assistantActive: boolean;
  languages: string[];
  humanHandoff: boolean;
  handoffKeyword: string;
  notifyConfirmation: boolean;
  notifyReminder: boolean;
  notifyCancellation: boolean;
  notifyReschedule: boolean;
  adminName: string;
  adminEmail: string;
}
