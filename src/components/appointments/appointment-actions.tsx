import { createContext, useContext, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { CalendarClock, CheckCircle2, Eye, MoreHorizontal, Pencil, UserX, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SourceBadge, StatusBadge } from "@/components/common/badges";
import { AppointmentFormDialog } from "./appointment-form-dialog";
import { appointmentService, useClinic } from "@/services/demo/store";
import { formatINR, formatTime12, initials } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/types/clinic";

type Ctx = {
  view: (a: Appointment) => void;
  edit: (a: Appointment, mode?: "edit" | "reschedule") => void;
  create: () => void;
  confirmStatus: (a: Appointment, status: AppointmentStatus) => void;
};
const ActionsContext = createContext<Ctx | null>(null);

export function useAppointmentActions() {
  const ctx = useContext(ActionsContext);
  if (!ctx) throw new Error("useAppointmentActions must be used inside AppointmentActionsProvider");
  return ctx;
}

const confirmCopy: Partial<Record<AppointmentStatus, { title: string; body: string; cta: string }>> = {
  cancelled: {
    title: "Cancel this appointment?",
    body: "The slot will be released for other patients. This can't be undone from here.",
    cta: "Cancel appointment",
  },
  "no-show": {
    title: "Mark as no-show?",
    body: "This records that the patient didn't attend. It counts towards no-show analytics.",
    cta: "Mark no-show",
  },
};

/** Hosts the details drawer, form dialog and confirmations for any appointment list. */
export function AppointmentActionsProvider({ children }: { children: ReactNode }) {
  const [viewing, setViewing] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ appt?: Appointment; mode: "create" | "edit" | "reschedule" } | null>(null);
  const [confirm, setConfirm] = useState<{ appt: Appointment; status: AppointmentStatus } | null>(null);

  const applyStatus = (a: Appointment, status: AppointmentStatus) => {
    appointmentService.setStatus(a.id, status);
    toast.success(`${a.id} marked ${status}`);
  };

  const ctx: Ctx = {
    view: (a) => setViewing(a.id),
    edit: (a, mode = "edit") => setEditing({ appt: a, mode }),
    create: () => setEditing({ mode: "create" }),
    confirmStatus: (a, status) => (confirmCopy[status] ? setConfirm({ appt: a, status }) : applyStatus(a, status)),
  };

  const copy = confirm ? confirmCopy[confirm.status] : undefined;

  return (
    <ActionsContext.Provider value={ctx}>
      {children}
      <AppointmentDrawer id={viewing} onClose={() => setViewing(null)} />
      <AppointmentFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        appointment={editing?.appt}
        mode={editing?.mode}
      />
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirm && applyStatus(confirm.appt, confirm.status)}
            >
              {copy?.cta}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ActionsContext.Provider>
  );
}

export function AppointmentRowMenu({ appointment: a }: { appointment: Appointment }) {
  const { view, edit, confirmStatus } = useAppointmentActions();
  const open = a.status === "confirmed" || a.status === "pending";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${a.id}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => view(a)}><Eye className="size-4" /> View details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => edit(a)} disabled={!open}><Pencil className="size-4" /> Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => edit(a, "reschedule")} disabled={!open}>
          <CalendarClock className="size-4" /> Reschedule
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {a.status === "pending" && (
          <DropdownMenuItem onSelect={() => confirmStatus(a, "confirmed")}>
            <CheckCircle2 className="size-4" /> Confirm
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => confirmStatus(a, "completed")} disabled={!open}>
          <CheckCircle2 className="size-4" /> Mark completed
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => confirmStatus(a, "no-show")} disabled={!open}>
          <UserX className="size-4" /> Mark no-show
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => confirmStatus(a, "cancelled")}
          disabled={!open}
          className="text-destructive focus:text-destructive"
        >
          <XCircle className="size-4" /> Cancel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{children}</span>
    </div>
  );
}

function AppointmentDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const appt = useClinic((s) => s.appointments.find((a) => a.id === id));
  const patients = useClinic((s) => s.patients);
  const doctors = useClinic((s) => s.doctors);
  const services = useClinic((s) => s.services);
  const { edit, confirmStatus } = useAppointmentActions();
  const patient = patients.find((p) => p.id === appt?.patientId);
  const doctor = doctors.find((d) => d.id === appt?.doctorId);
  const service = services.find((s) => s.id === appt?.serviceId);
  const open = appt && (appt.status === "confirmed" || appt.status === "pending");

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {appt && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{appt.id}</span>
                <StatusBadge status={appt.status} />
              </div>
              <SheetTitle className="text-lg">{service?.name}</SheetTitle>
              <SheetDescription>
                {format(parseISO(appt.date), "EEEE, dd MMMM yyyy")} · {formatTime12(appt.time)}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <section>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Patient</h3>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="grid size-10 place-items-center rounded-full bg-teal-soft text-sm font-semibold text-teal-soft-foreground">
                    {initials(patient?.name ?? "?")}
                  </span>
                  <div className="text-sm">
                    <div className="font-medium text-foreground">{patient?.name}</div>
                    <div className="text-muted-foreground">{patient?.phone} · {patient?.age} yrs</div>
                  </div>
                </div>
              </section>
              <section>
                <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Appointment</h3>
                <Row label="Doctor">{doctor?.name}</Row>
                <Row label="Specialization">{doctor?.specialization}</Row>
                <Row label="Duration">{service?.durationMinutes} min</Row>
                <Row label="Fee">{formatINR(service?.price)}</Row>
                <Row label="Booking source"><SourceBadge source={appt.source} /></Row>
                <Row label="Created">{format(parseISO(appt.createdAt), "dd MMM yyyy, hh:mm a")}</Row>
              </section>
              <Separator />
              <section>
                <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Notes</h3>
                <p className="text-sm text-foreground">{appt.notes ?? <span className="text-muted-foreground">No notes added.</span>}</p>
              </section>
              {open && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" onClick={() => edit(appt, "reschedule")}>Reschedule</Button>
                  <Button variant="outline" onClick={() => edit(appt)}>Edit</Button>
                  <Button onClick={() => confirmStatus(appt, "completed")}>Mark completed</Button>
                  <Button variant="outline" className="text-destructive" onClick={() => confirmStatus(appt, "cancelled")}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
