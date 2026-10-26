import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DemoBadge } from "./badges";

export function PageHeader({
  title,
  subtitle,
  actions,
  demo = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  demo?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card shadow-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  change?: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="grid size-7 place-items-center rounded-md bg-teal-soft text-teal-soft-foreground">
          <Icon className="size-3.5" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {change !== undefined && (
          <span className={cn("font-medium", change >= 0 ? "text-success" : "text-danger")}>
            {change >= 0 ? "+" : ""}
            {change}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">{children}</div>;
}
