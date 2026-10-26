import { cn } from "@/lib/utils";

/** Arovia mark: a soft medical cross whose lower arm curves into a caring leaf. */
export function AroviaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M13 7.5h6v6h6v5h-6c0 3.6-2.4 6-6 6v-11H7v-5h6z"
        className="fill-teal"
      />
      <circle cx="21.5" cy="22.5" r="2.25" className="fill-primary-foreground" />
    </svg>
  );
}

export function AroviaLogo({
  className,
  subtitle = "Healthcare Management",
  collapsed = false,
}: {
  className?: string;
  subtitle?: string | null;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <AroviaMark className="shrink-0" />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            Arovia <span className="text-teal">Clinic AI</span>
          </div>
          {subtitle && <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}
