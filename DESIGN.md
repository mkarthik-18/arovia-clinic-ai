# Design System and UI Guidance

## Brand

- **Product:** Arovia Clinic AI
- **Dashboard:** Arovia Healthcare Dashboard
- **Assistant:** Arovia Assistant
- **Tagline:** Care that understands you.
- **Tone:** Calm, clear, healthcare-oriented, and reassuring. State demo or connection status plainly.

The existing Arovia cross/leaf mark is defined in `src/components/brand/logo.tsx` and is reused in the dashboard and login screen. The matching favicon is `public/favicon.svg`.

## Layout and navigation

- The desktop dashboard uses a persistent clinic sidebar and a sticky top bar.
- The top bar identifies the current screen below the “Arovia Healthcare Dashboard” breadcrumb.
- Sidebar sections provide the eight primary operational routes and two supporting routes: Settings and Help & Support.
- The shell adapts to compact/mobile layouts using the existing sidebar components.
- `/login` uses a separate split-screen composition and does not render the dashboard shell.
- Dashboard content uses the shared page header, page container, panels, and data-display components in `src/components/common/page.tsx`.
- Preserve existing spacing, responsive behavior, transitions, and component composition when editing screens.

## Typography

- Primary typeface: Geist.
- Monospaced typeface: Geist Mono.
- Fonts are requested from Google Fonts by root route metadata. CSS supplies system fallbacks if the external font request is unavailable.
- Maintain the existing hierarchy: large page titles, compact section headings, muted helper text, and tabular values for metrics.

## Color tokens

`src/styles.css` is the source of truth. It defines semantic custom properties in OKLCH for both `:root` (light) and `.dark` themes and maps them to Tailwind utilities using `@theme inline`.

Use semantic roles rather than choosing a raw color:

| Role | Token family | Typical use |
| --- | --- | --- |
| Primary | `background`, `foreground`, `primary`, `secondary`, `muted`, `accent` | Main surfaces, text, buttons, secondary actions |
| Clinic accent | `teal`, `teal-foreground`, `teal-soft`, `teal-soft-foreground` | Brand mark, highlights, selected navigation, subtle emphasis |
| Status | `success`, `warning`, `info`, `danger`, `neutral` and corresponding `*-soft` tokens | Appointment, availability, and connection states |
| Navigation | `sidebar`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`, related tokens | Sidebar surface, text, selected state |
| Data visualization | `chart-1` through `chart-5` | Analytics charts |
| Structure | `border`, `input`, `ring`, `shadow-card`, `shadow-pop`, `radius` | Dividers, controls, focus, elevation, corners |

Both themes should retain accessible text contrast. Add new semantic colors in both theme blocks and register them in `@theme inline`; do not hardcode a component-specific palette.

## Components and interaction

- Reuse components from `src/components/ui` and shared page components before creating new primitives.
- Use Lucide icons consistently with existing size and stroke patterns.
- Use badges and text to convey status; never rely on color alone.
- Buttons, dialogs, tabs, dropdowns, search, tables, and forms should continue using their established Radix/shadcn-style component wrappers.
- Disabled or unavailable integration actions must explain why they are unavailable.
- Demo records and sample conversations must remain identifiable as demo content.

## Visual constraints

- Do not redesign the existing dashboard as part of maintenance or integration work.
- Preserve sidebar, header, navigation, page arrangement, card styling, colors, typography, and animation behavior unless a visual change is explicitly requested.
- Prefer semantic Tailwind utilities mapped to the project tokens; avoid raw color classes and one-off inline styles.
- Preserve accessible labels, focus states, keyboard interaction, and responsive layouts.

## UI inventory

The ten dashboard screens are Overview, Appointments, Patients, Doctors, Services, Availability, Conversations, Analytics, Settings, and Help & Support. Product requirements and current behavior are documented in `PRD.md`.
