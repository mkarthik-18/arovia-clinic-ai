# Architecture

## Overview

Arovia Clinic AI is a standalone React and TypeScript web application built with TanStack Start, file-based TanStack Router routes, Vite, and Tailwind CSS v4. The current app is a client-interactive demo backed by in-memory sample state; it does not require a database or integration service.

```text
Browser
  └── TanStack Start / Vite application
      ├── TanStack Router file routes (src/routes)
      ├── Shared dashboard shell (src/components/layout)
      ├── UI components and design tokens (src/components, src/styles.css)
      ├── Demo service API (src/services/demo/store.ts)
      │   └── Seed data (src/services/demo/seed.ts)
      └── Pure scheduling rules (src/lib/scheduling.ts)
```

## Runtime and build configuration

- `vite.config.ts` configures Tailwind, TanStack Start, React, the `@` source alias, and the custom TanStack Start server entry.
- `src/router.tsx` creates a router for the generated route tree and provides a React Query client.
- `src/start.ts` configures request middleware, error handling, and CSRF protection for server functions.
- `src/server.ts` wraps the TanStack Start server entry and converts catastrophic SSR failures into an HTML error response.
- `src/routeTree.gen.ts` is generated from the files in `src/routes`; do not edit it manually.
- `tsconfig.json` enables strict TypeScript checks and defines the same `@/*` source alias for the type checker.
- `vitest.config.ts` configures Vitest with jsdom and `src/test/setup.ts`.

## Routes and layouts

TanStack Router file routes are defined under `src/routes`. The root route, `src/routes/__root.tsx`, owns document metadata, favicon/font links, global providers, the 404/error views, and the shared shell.

The root route renders the `AppShell` for dashboard screens and deliberately renders `/login` without that shell. The shell contains the sidebar and top bar and remains mounted during navigation. The ten dashboard pages are:

`/`, `/appointments`, `/patients`, `/doctors`, `/services`, `/availability`, `/conversations`, `/analytics`, `/settings`, and `/help`.

Dashboard routes use `ssr: false` where appropriate because sample displays include date-relative demo values.

## Data and state

The `src/types/clinic.ts` module defines the shared domain shapes: appointments, patients, doctors, services, schedules, blocked dates, conversations, activity items, and clinic settings.

`src/services/demo/seed.ts` builds sample records. `src/services/demo/store.ts` owns the in-memory state, `useClinic(selector)` subscription hook, reset operation, and service objects:

- `appointmentService`
- `patientService`
- `doctorService`
- `serviceService`
- `availabilityService`
- `conversationService`
- `settingsService`

Components read and mutate records through these services rather than keeping separate record copies. Selectors passed to `useClinic` must return stable references from the current state; derive new values in `useMemo` or during rendering as appropriate. Reloading the page reinitializes the demo state from the seed.

`src/lib/scheduling.ts` contains pure slot-generation and double-booking rules. UI workflows use those rules so they can later be mirrored and enforced by a trusted backend.

## Styling and visual system

Tailwind CSS v4 is loaded from `src/styles.css`. Semantic CSS variables define light and dark palettes, teal, status colors, chart colors, radii, shadows, and typography. Tailwind utility colors are mapped to these tokens. Keep component colors token-based; avoid adding raw color utilities.

The Geist and Geist Mono font families are requested from Google Fonts in root metadata, with system-font fallbacks defined in CSS. Loading the remote font is optional; the application layout and fallback typography remain available without it.

## Tests

- `src/lib/scheduling.test.ts` covers clinic slots, blocked dates, and double-booking behavior.
- `src/test/app-routing.test.tsx` checks that all ten dashboard paths match routes in the generated route tree.
- `src/test/setup.ts` configures jsdom test helpers.
- Run the suite using `npm test`.

## Future backend boundaries

Do not connect external services as part of routine UI work. When integration work is approved:

1. Preserve service interfaces or introduce typed service boundaries that let screens remain independent of backend implementation.
2. Use Supabase or another approved backend for persistent clinic data and authentication; enforce authorization and clinic isolation server-side.
3. Route WhatsApp webhooks and automation through authenticated, verified server-side n8n workflows.
4. Call Gemini only from trusted server-side code or secure automation, never directly from browser code with a secret.
5. Validate scheduling and booking conflicts on the server as well as in the client.
6. Store credentials in the approved server-side secret store; do not expose them through `VITE_*` variables or ship them in browser bundles.
