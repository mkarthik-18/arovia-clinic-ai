/**
 * DEMO DATA ONLY.
 * Realistic sample records used until a secure clinic backend is connected.
 * Nothing here is live clinic data.
 */
import { addDays, format, subDays, subMinutes } from "date-fns";
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
import { clinicSlotsForDate } from "@/lib/scheduling";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

export const seedSchedule: ClinicSchedule = {
  slotMinutes: 30,
  maxPerSlot: 1,
  week: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: day !== 0,
    sessions:
      day === 0
        ? []
        : [
            { start: "09:00", end: "13:00" },
            { start: "16:00", end: "20:00" },
          ],
  })),
};

export const seedDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Priya Reddy",
    specialization: "General Physician",
    phone: "+91 98480 11021",
    email: "priya.reddy@aroviaclinic.in",
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: "09:00",
    endTime: "20:00",
    slotMinutes: 30,
    active: true,
  },
  {
    id: "doc-2",
    name: "Dr. Arjun Rao",
    specialization: "Dermatologist",
    phone: "+91 98480 11022",
    email: "arjun.rao@aroviaclinic.in",
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: "09:00",
    endTime: "20:00",
    slotMinutes: 30,
    active: true,
  },
  {
    id: "doc-3",
    name: "Dr. Meera Sharma",
    specialization: "Pediatrician",
    phone: "+91 98480 11023",
    email: "meera.sharma@aroviaclinic.in",
    workingDays: [1, 3, 5, 6],
    startTime: "09:00",
    endTime: "13:00",
    slotMinutes: 30,
    active: true,
  },
  {
    id: "doc-4",
    name: "Dr. Karan Mehta",
    specialization: "Dentist",
    phone: "+91 98480 11024",
    email: "karan.mehta@aroviaclinic.in",
    workingDays: [2, 4, 6],
    startTime: "16:00",
    endTime: "20:00",
    slotMinutes: 30,
    active: false,
  },
];

export const seedServices: Service[] = [
  {
    id: "svc-1",
    name: "General Consultation",
    description: "Routine check-up and diagnosis for common health concerns.",
    durationMinutes: 30,
    price: 500,
    doctorIds: ["doc-1"],
    active: true,
  },
  {
    id: "svc-2",
    name: "Dermatology",
    description: "Assessment and treatment of skin, hair and nail conditions.",
    durationMinutes: 30,
    price: 800,
    doctorIds: ["doc-2"],
    active: true,
  },
  {
    id: "svc-3",
    name: "Skin Consultation",
    description: "Focused consultation for acne, pigmentation and skin care plans.",
    durationMinutes: 30,
    price: 700,
    doctorIds: ["doc-2"],
    active: true,
  },
  {
    id: "svc-4",
    name: "Pediatric Consultation",
    description: "Child health check-ups, growth monitoring and vaccinations advice.",
    durationMinutes: 30,
    price: 600,
    doctorIds: ["doc-3"],
    active: true,
  },
  {
    id: "svc-5",
    name: "Fever and Cold Consultation",
    description: "Quick consultation for fever, cough, cold and seasonal infections.",
    durationMinutes: 30,
    price: 400,
    doctorIds: ["doc-1", "doc-3"],
    active: true,
  },
  {
    id: "svc-6",
    name: "Follow-up Consultation",
    description: "Review visit after a previous consultation or treatment.",
    durationMinutes: 30,
    price: 300,
    doctorIds: ["doc-1", "doc-2", "doc-3"],
    active: true,
  },
  {
    id: "svc-7",
    name: "Dental Consultation",
    description: "Oral examination, cleaning advice and treatment planning.",
    durationMinutes: 30,
    price: 600,
    doctorIds: ["doc-4"],
    active: false,
  },
];

const names = [
  "Rahul Sharma",
  "Sneha Kumar",
  "Akash Verma",
  "Ananya Patel",
  "Vikram Singh",
  "Pooja Nair",
  "Rohan Gupta",
  "Kavya Iyer",
  "Arjun Malhotra",
  "Divya Menon",
  "Siddharth Jain",
  "Neha Kapoor",
  "Aditya Bose",
  "Ishita Desai",
  "Karthik Reddy",
  "Meghna Rao",
  "Harsh Agarwal",
  "Priyanka Das",
  "Nikhil Joshi",
  "Shreya Pillai",
  "Manish Tiwari",
  "Aarti Kulkarni",
  "Varun Chopra",
  "Lakshmi Srinivasan",
];

function buildPatients(today: Date): Patient[] {
  const r = rng(7);
  const list: Patient[] = names.map((name, i) => {
    const first = name.split(" ")[0]!.toLowerCase();
    return {
      id: `PT-${String(1001 + i)}`,
      name,
      phone: `+91 9${String(Math.floor(100000000 + r() * 899999999))}`,
      age: 4 + Math.floor(r() * 62),
      email: r() > 0.25 ? `${first}.${name.split(" ")[1]!.toLowerCase()}@gmail.com` : undefined,
      registeredAt: subDays(today, Math.floor(r() * 120) + (i < 4 ? 0 : 3)).toISOString(),
      source: r() > 0.3 ? "whatsapp" : "admin",
    };
  });
  list[0]!.age = 25; // matches the sample WhatsApp conversation
  return list;
}

function doctorForService(serviceId: string, r: () => number): string {
  const svc = seedServices.find((s) => s.id === serviceId)!;
  return svc.doctorIds[Math.floor(r() * svc.doctorIds.length)]!;
}

function buildAppointments(today: Date, patients: Patient[]): Appointment[] {
  const r = rng(42);
  const list: Appointment[] = [];
  const t = ymd(today);
  let seq = 2401;
  const id = () => `APT-${seq++}`;

  // Today's featured appointments from the brief
  const featured: [number, string, string, string, AppointmentStatus, "whatsapp" | "admin"][] = [
    [0, "doc-1", "svc-1", "10:00", "confirmed", "whatsapp"],
    [1, "doc-2", "svc-2", "11:30", "confirmed", "whatsapp"],
    [2, "doc-1", "svc-1", "12:00", "pending", "admin"],
    [3, "doc-2", "svc-3", "16:00", "confirmed", "whatsapp"],
  ];
  for (const [pi, doctorId, serviceId, time, status, source] of featured) {
    list.push({
      id: id(),
      patientId: patients[pi]!.id,
      doctorId,
      serviceId,
      date: t,
      time,
      status,
      source,
      createdAt: subDays(today, 1).toISOString(),
    });
  }

  const activeServices = seedServices.filter((s) => s.active).map((s) => s.id);
  for (let offset = -75; offset <= 14; offset++) {
    if (offset === 0) continue;
    const day = addDays(today, offset);
    const date = ymd(day);
    const count = Math.floor(r() * 6) + (offset < 0 ? 2 : 1);
    for (let k = 0; k < count; k++) {
      const serviceId = activeServices[Math.floor(r() * activeServices.length)]!;
      const doctorId = doctorForService(serviceId, r);
      const doctor = seedDoctors.find((d) => d.id === doctorId)!;
      const slots = clinicSlotsForDate(date, seedSchedule, [], doctor);
      if (!slots.length) continue;
      const time = slots[Math.floor(r() * slots.length)]!;
      if (list.some((a) => a.doctorId === doctorId && a.date === date && a.time === time)) continue;
      const roll = r();
      const status: AppointmentStatus =
        offset < 0
          ? roll < 0.74
            ? "completed"
            : roll < 0.88
              ? "cancelled"
              : "no-show"
          : roll < 0.8
            ? "confirmed"
            : roll < 0.93
              ? "pending"
              : "cancelled";
      list.push({
        id: id(),
        patientId: patients[Math.floor(r() * patients.length)]!.id,
        doctorId,
        serviceId,
        date,
        time,
        status,
        source: r() < 0.72 ? "whatsapp" : "admin",
        notes: r() < 0.2 ? "Patient requested a morning slot." : undefined,
        createdAt: subDays(day, 1 + Math.floor(r() * 4)).toISOString(),
      });
    }
  }
  // Rahul's WhatsApp booking from the sample conversation: next open day, 11:30 AM
  let next = addDays(today, 1);
  while (next.getDay() === 0) next = addDays(next, 1);
  const nextDate = ymd(next);
  const clash = list.findIndex(
    (a) => a.doctorId === "doc-1" && a.date === nextDate && a.time === "11:30",
  );
  if (clash >= 0) list.splice(clash, 1);
  list.push({
    id: "APT-2400",
    patientId: patients[0]!.id,
    doctorId: "doc-1",
    serviceId: "svc-1",
    date: nextDate,
    time: "11:30",
    status: "confirmed",
    source: "whatsapp",
    createdAt: subMinutes(today, 21).toISOString(),
  });
  return list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function buildConversations(
  today: Date,
  patients: Patient[],
  appointments: Appointment[],
): Conversation[] {
  const base = subMinutes(today, 25);
  const at = (mins: number) => subMinutes(base, -mins).toISOString();
  const rahulAppt = appointments.find((a) => a.id === "APT-2400")!;

  const rahul: Conversation = {
    id: "conv-1",
    patientId: patients[0]!.id,
    status: "booked",
    unread: 0,
    messages: [
      { id: "m1", from: "patient", text: "Hi, I want to book an appointment.", at: at(0) },
      {
        id: "m2",
        from: "assistant",
        text: "Welcome to Arovia Clinic! May I know your name?",
        at: at(0.2),
      },
      { id: "m3", from: "patient", text: "Rahul Sharma.", at: at(1) },
      {
        id: "m4",
        from: "assistant",
        text: "Thank you! Could you please tell me your age?",
        at: at(1.2),
      },
      { id: "m5", from: "patient", text: "25.", at: at(2) },
      {
        id: "m6",
        from: "assistant",
        text: "What would you like to consult our doctor about?",
        at: at(2.2),
      },
      { id: "m7", from: "patient", text: "General consultation.", at: at(3) },
      {
        id: "m8",
        from: "assistant",
        text: "Sure! We have availability tomorrow at 10:00 AM, 11:30 AM and 4:00 PM. Which time works for you?",
        at: at(3.3),
      },
      { id: "m9", from: "patient", text: "11:30 AM.", at: at(4) },
      { id: "m10", from: "assistant", text: "Your appointment has been confirmed!", at: at(4.2) },
      {
        id: "m11",
        from: "assistant",
        text: "",
        at: at(4.3),
        kind: "booking",
        appointmentId: rahulAppt.id,
      },
    ],
  };

  const simple = (
    id: string,
    pi: number,
    status: Conversation["status"],
    unread: number,
    minsAgo: number,
    lines: [Conversation["messages"][number]["from"], string][],
  ): Conversation => ({
    id,
    patientId: patients[pi]!.id,
    status,
    unread,
    messages: lines.map(([from, text], i) => ({
      id: `${id}-${i}`,
      from,
      text,
      at: subMinutes(today, minsAgo - i).toISOString(),
    })),
  });

  return [
    simple("conv-2", 1, "active", 2, 6, [
      ["patient", "Hello, is Dr. Arjun Rao available this Saturday?"],
      [
        "assistant",
        "Dr. Arjun Rao is available on Saturday between 9:00 AM and 1:00 PM. Would you like me to book a slot?",
      ],
      ["patient", "Yes, around 11 please."],
      ["patient", "Also, how much is the consultation fee?"],
    ]),
    rahul,
    simple("conv-3", 4, "needs-attention", 1, 48, [
      ["patient", "I need to reschedule my appointment, something urgent came up."],
      [
        "assistant",
        "I'm sorry to hear that. I've flagged this for our front desk team, who will get back to you shortly.",
      ],
      ["patient", "Please call me as soon as possible."],
    ]),
    simple("conv-4", 5, "booked", 0, 130, [
      ["patient", "Book a pediatric consultation for my son, he is 6."],
      [
        "assistant",
        "Of course. Dr. Meera Sharma is available on Friday at 10:00 AM. Shall I confirm?",
      ],
      ["patient", "Yes please."],
      ["assistant", "Your appointment has been confirmed!"],
    ]),
    simple("conv-5", 8, "closed", 0, 600, [
      ["patient", "What are your clinic timings?"],
      [
        "assistant",
        "We're open Monday to Saturday, 9:00 AM – 1:00 PM and 4:00 PM – 8:00 PM. We're closed on Sundays.",
      ],
      ["patient", "Thanks!"],
    ]),
    simple("conv-6", 11, "active", 0, 1500, [
      ["patient", "Do you treat hair fall?"],
      [
        "assistant",
        "Yes, our dermatologist Dr. Arjun Rao treats hair and scalp conditions. Would you like to book a consultation?",
      ],
    ]),
  ];
}

function buildActivity(today: Date): ActivityItem[] {
  const ago = (m: number) => subMinutes(today, m).toISOString();
  return [
    {
      id: "act-1",
      type: "booked",
      text: "Rahul Sharma booked General Consultation via WhatsApp",
      at: ago(21),
    },
    {
      id: "act-2",
      type: "registered",
      text: "Sneha Kumar registered as a new patient",
      at: ago(64),
    },
    {
      id: "act-3",
      type: "rescheduled",
      text: "Vikram Singh rescheduled to tomorrow, 04:30 PM",
      at: ago(118),
    },
    {
      id: "act-4",
      type: "cancelled",
      text: "Neha Kapoor cancelled Skin Consultation",
      at: ago(205),
    },
    {
      id: "act-5",
      type: "completed",
      text: "Dr. Priya Reddy completed 6 consultations",
      at: ago(380),
    },
  ];
}

export const seedSettings: ClinicSettings = {
  clinicName: "Arovia Clinic",
  address: "Plot 42, Road No. 12, Banjara Hills, Hyderabad 500034",
  phone: "+91 40 4012 3456",
  email: "hello@aroviaclinic.in",
  website: "https://aroviaclinic.in",
  mapsUrl: "https://maps.google.com/?q=Arovia+Clinic+Hyderabad",
  timeZone: "Asia/Kolkata",
  assistantName: "Arovia Assistant",
  welcomeMessage: "Welcome to Arovia Clinic! May I know your name?",
  assistantActive: true,
  languages: ["English", "Hindi", "Telugu"],
  humanHandoff: true,
  handoffKeyword: "talk to staff",
  notifyConfirmation: true,
  notifyReminder: true,
  notifyCancellation: true,
  notifyReschedule: true,
  adminName: "Admin",
  adminEmail: "admin@aroviaclinic.in",
};

export function buildSeed(today = new Date()) {
  const patients = buildPatients(today);
  const appointments = buildAppointments(today, patients);
  const blocked: BlockedDate[] = [
    { id: "blk-1", date: ymd(addDays(today, 9)), reason: "Clinic maintenance" },
    {
      id: "blk-2",
      date: ymd(addDays(today, 4)),
      reason: "Dr. Arjun Rao on leave",
      doctorId: "doc-2",
    },
  ];
  return {
    doctors: seedDoctors,
    services: seedServices,
    patients,
    appointments,
    conversations: buildConversations(today, patients, appointments),
    activity: buildActivity(today),
    schedule: seedSchedule,
    blocked,
    settings: seedSettings,
  };
}
