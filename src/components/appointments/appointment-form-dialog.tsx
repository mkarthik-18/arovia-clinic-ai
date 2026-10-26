import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { appointmentService, BookingConflictError, useClinic } from "@/services/demo/store";
import { availableSlots } from "@/lib/scheduling";
import { formatTime12, todayISO } from "@/lib/format";
import type { Appointment } from "@/types/clinic";

const schema = z.object({
  patientId: z.string().min(1, "Choose a patient"),
  doctorId: z.string().min(1, "Choose a doctor"),
  serviceId: z.string().min(1, "Choose a service"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time slot"),
  source: z.enum(["whatsapp", "admin"]),
  notes: z.string().max(500).optional(),
});
type FormValues = z.infer<typeof schema>;

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  mode = "create",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  appointment?: Appointment | undefined;
  mode?: "create" | "edit" | "reschedule" | undefined;
}) {
  const patients = useClinic((s) => s.patients);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const schedule = useClinic((s) => s.schedule);
  const blocked = useClinic((s) => s.blocked);
  const appointments = useClinic((s) => s.appointments);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { patientId: "", doctorId: "", serviceId: "", date: todayISO(), time: "", source: "admin", notes: "" },
  });
  const { register, control, handleSubmit, watch, setValue, reset, formState } = form;

  useEffect(() => {
    if (!open) return;
    reset(
      appointment
        ? {
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            serviceId: appointment.serviceId,
            date: appointment.date,
            time: appointment.time,
            source: appointment.source,
            notes: appointment.notes ?? "",
          }
        : { patientId: "", doctorId: "", serviceId: "", date: todayISO(), time: "", source: "admin", notes: "" },
    );
  }, [open, appointment, reset]);

  const doctorId = watch("doctorId");
  const date = watch("date");
  const time = watch("time");
  const doctor = doctors.find((d) => d.id === doctorId);
  const doctorServices = services.filter((s) => s.active && (!doctorId || s.doctorIds.includes(doctorId)));

  const slots = useMemo(() => {
    if (!doctor || !date) return [];
    const others = appointments.filter((a) => a.id !== appointment?.id);
    return availableSlots(date, doctor, schedule, blocked, others);
  }, [doctor, date, schedule, blocked, appointments, appointment?.id]);

  useEffect(() => {
    if (time && slots.length && !slots.includes(time)) setValue("time", "");
  }, [slots, time, setValue]);

  const onSubmit = (v: FormValues) => {
    try {
      if (appointment) {
        appointmentService.update(appointment.id, { ...v, notes: v.notes || undefined });
        toast.success(mode === "reschedule" ? "Appointment rescheduled" : "Appointment updated");
      } else {
        const created = appointmentService.create({ ...v, notes: v.notes || undefined, status: "confirmed" });
        toast.success(`Appointment ${created.id} created`);
      }
      onOpenChange(false);
    } catch (e) {
      if (e instanceof BookingConflictError) toast.error(e.message);
      else throw e;
    }
  };

  const title = mode === "reschedule" ? "Reschedule appointment" : appointment ? "Edit appointment" : "New appointment";
  const err = formState.errors;
  const lockDetails = mode === "reschedule";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Only free slots within the clinic and doctor's working hours are shown.
          </DialogDescription>
        </DialogHeader>
        <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient" error={err.patientId?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="patientId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={lockDetails}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.phone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Doctor" error={err.doctorId?.message}>
            <Controller
              control={control}
              name="doctorId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    const svc = watch("serviceId");
                    if (svc && !services.find((s) => s.id === svc)?.doctorIds.includes(v)) setValue("serviceId", "");
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.filter((d) => d.active).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Service" error={err.serviceId?.message}>
            <Controller
              control={control}
              name="serviceId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={lockDetails}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {doctorServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Date" error={err.date?.message}>
            <Input type="date" min={todayISO()} {...register("date")} />
          </Field>
          <Field label="Time" error={err.time?.message}>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!doctor}>
                  <SelectTrigger>
                    <SelectValue placeholder={!doctor ? "Choose doctor first" : slots.length ? "Select slot" : "No free slots"} />
                  </SelectTrigger>
                  <SelectContent>
                    {slots.map((t) => (
                      <SelectItem key={t} value={t}>{formatTime12(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {!lockDetails && (
            <>
              <Field label="Booking source">
                <Controller
                  control={control}
                  name="source"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea rows={3} placeholder="Optional notes for the doctor or front desk" {...register("notes")} />
              </Field>
            </>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="appointment-form">
            {appointment ? "Save changes" : "Create appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-xs font-medium text-foreground">{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
