import { MessageCircle, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, BookingSource, ConversationStatus } from "@/types/clinic";

const statusStyles: Record<AppointmentStatus, string> = {
  confirmed: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning",
  cancelled: "bg-danger-soft text-danger",
  completed: "bg-info-soft text-info",
  "no-show": "bg-neutral-soft text-neutral",
};

const statusLabel: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
  completed: "Completed",
  "no-show": "No-show",
};

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function SourceBadge({ source }: { source: BookingSource }) {
  const Icon = source === "whatsapp" ? MessageCircle : UserCog;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
      <Icon className="size-3.5" />
      {source === "whatsapp" ? "WhatsApp" : "Admin"}
    </span>
  );
}

const convStyles: Record<ConversationStatus, [string, string]> = {
  active: ["bg-teal-soft text-teal-soft-foreground", "Active"],
  booked: ["bg-success-soft text-success", "Booked"],
  "needs-attention": ["bg-warning-soft text-warning", "Needs attention"],
  closed: ["bg-neutral-soft text-neutral", "Closed"],
};

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const [cls, label] = convStyles[status];
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", cls)}>
      {label}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-success-soft text-success" : "bg-neutral-soft text-neutral",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      title="Sample data — not connected to a live database yet"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-dashed border-warning/40 bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-warning uppercase",
        className,
      )}
    >
      Demo data
    </span>
  );
}
