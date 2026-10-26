# Arovia Clinic AI — engineering rules

- Routing is TanStack Router file routes; the dashboard shell (sidebar + top bar) is applied in `__root.tsx` for every path except `/login`, so pages render only their content. Why: keeps the shell mounted across navigation.
- Dashboard routes set `ssr: false`. Why: they show date-relative demo data that would otherwise mismatch between server and browser.
- All data access goes through service objects (`src/services/demo/store.ts`: appointmentService, patientService, …) and the `useClinic(selector)` hook; components never hold their own copies of records. Why: the demo store can later be replaced by secure backend services with the same API.
- `useClinic` selectors must return existing references (a state slice or `.find()` result), never new arrays/objects; derive with `useMemo`. Why: `useSyncExternalStore` loops on unstable snapshots.
- Booking rules (clinic slots, doctor hours, blocked dates, double booking) live as pure functions in `src/lib/scheduling.ts` with tests beside them. Why: the same rules must be enforced again server-side when the backend lands.
- Every screen showing sample data shows the Demo badge; integrations that are not wired show "Not connected", never a fake online state.
- Colors come from tokens in `src/styles.css` (including teal, status and soft variants); no raw color utilities in components.
- tsconfig is strict with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`: optional props are typed `?: T | undefined` and indexed reads are guarded.
