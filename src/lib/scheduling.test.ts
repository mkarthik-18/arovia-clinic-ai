import { describe, expect, it } from "vitest";
import { availableSlots, clinicSlotsForDate, isDoubleBooked } from "./scheduling";
import { seedDoctors, seedSchedule } from "@/services/demo/seed";
import type { Appointment } from "@/types/clinic";

const priya = seedDoctors[0]!;
const MONDAY = "2026-10-26";
const SUNDAY = "2026-10-25";

const appt = (over: Partial<Appointment>): Appointment => ({
  id: "APT-1",
  patientId: "PT-1",
  doctorId: priya.id,
  serviceId: "svc-1",
  date: MONDAY,
  time: "10:00",
  status: "confirmed",
  source: "whatsapp",
  createdAt: "2026-10-20T00:00:00Z",
  ...over,
});

describe("clinic schedule", () => {
  it("is closed on Sunday", () => {
    expect(clinicSlotsForDate(SUNDAY, seedSchedule)).toEqual([]);
  });

  it("offers Monday slots from 9:00 AM to 1:00 PM and 4:00 PM to 8:00 PM", () => {
    const slots = clinicSlotsForDate(MONDAY, seedSchedule);
    expect(slots[0]).toBe("09:00");
    expect(slots).toContain("12:30");
    expect(slots).not.toContain("13:00");
    expect(slots).not.toContain("15:30");
    expect(slots).toContain("16:00");
    expect(slots.at(-1)).toBe("19:30");
  });

  it("offers nothing on a blocked date", () => {
    expect(clinicSlotsForDate(MONDAY, seedSchedule, [{ id: "b", date: MONDAY, reason: "Holiday" }])).toEqual([]);
  });
});

describe("double booking", () => {
  it("rejects a second booking for the same doctor, date and time", () => {
    expect(isDoubleBooked({ doctorId: priya.id, date: MONDAY, time: "10:00" }, [appt({})])).toBe(true);
  });

  it("allows the slot again once the first booking is cancelled", () => {
    expect(isDoubleBooked({ doctorId: priya.id, date: MONDAY, time: "10:00" }, [appt({ status: "cancelled" })])).toBe(false);
  });

  it("hides taken slots from the available list", () => {
    const free = availableSlots(MONDAY, priya, seedSchedule, [], [appt({})]);
    expect(free).not.toContain("10:00");
    expect(free).toContain("10:30");
  });
});
