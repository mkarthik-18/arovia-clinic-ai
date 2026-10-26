import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SortDir = "asc" | "desc";

export function useSortPage<T>(
  rows: T[],
  getters: Record<string, (row: T) => string | number>,
  initial: { key: string; dir: SortDir },
  pageSize = 10,
) {
  const [sort, setSort] = useState(initial);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const get = getters[sort.key];
    if (!get) return rows;
    return [...rows].sort((a, b) => {
      const va = get(a);
      const vb = get(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? cmp : -cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);
  const toggle = (key: string) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return { sort, toggle, page, setPage, pageCount, pageRows, total: sorted.length, pageSize };
}

export function SortHeader({
  label,
  k,
  sort,
  onToggle,
  className,
}: {
  label: string;
  k: string;
  sort: { key: string; dir: SortDir };
  onToggle: (k: string) => void;
  className?: string;
}) {
  const Icon = sort.key !== k ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", sort.key === k && "text-foreground", className)}
    >
      {label}
      <Icon className="size-3" />
    </button>
  );
}

export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
      <span>
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="size-7" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="px-2">
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="icon" className="size-7" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-8 pl-8 text-sm" />
    </div>
  );
}
