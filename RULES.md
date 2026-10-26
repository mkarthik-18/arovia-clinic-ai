# Engineering Rules

These rules preserve the existing Arovia Clinic AI architecture and user experience.

## Routing and layout

- Use TanStack Router file-based routes under `src/routes`.
- Keep the shared dashboard shell in the root route. It applies to dashboard paths and is omitted for `/login`.
- Preserve all ten dashboard routes and their existing page behavior.
- Do not hand-edit `src/routeTree.gen.ts`; it is generated.
- Keep dashboard routes client-rendered when their date-relative demo data would otherwise cause server/client mismatches.

## Data and services

- Route record reads and writes through service objects in `src/services/demo/store.ts` and the `useClinic(selector)` hook.
- Do not maintain component-owned copies of clinic records.
- `useClinic` selectors must return stable references already held in state (for example, a state slice or `.find()` result). Do not return a freshly allocated array or object from a selector; derive values with `useMemo`.
- Keep scheduling constraints as pure functions in `src/lib/scheduling.ts` and add or update neighboring tests.
- Treat all current records and conversations as demo data. Changes in the in-memory store do not persist after reload.
- Do not represent authentication, WhatsApp, AI, or database integrations as connected unless they are implemented and verified.

## Security and integrations

- Do not add Supabase, n8n, WhatsApp, or Gemini connectivity without explicit scope and implementation approval.
- Never place service-role keys, API keys, private webhook URLs, webhook secrets, or other credentials in browser code, source-controlled `.env` files, or `VITE_*` variables.
- Enforce authentication, authorization, clinic scoping, webhook validation, and booking-conflict rules on trusted server-side boundaries when integrations are introduced.
- Avoid fake online statuses, fabricated backend responses, or success-shaped fallbacks for disconnected integrations.

## Design and accessibility

- Preserve the established layout, colors, typography, animations, sidebar, navigation, and dashboard components unless a product change explicitly requires otherwise.
- Use semantic design tokens from `src/styles.css` for colors, statuses, surfaces, shadows, and typography. Do not add raw color utilities to components.
- Keep controls accessible: use semantic elements, labels, keyboard-operable interactions, visible focus, and clear status text.
- Every page showing sample data must make its demo status clear. Pages without sample data may omit the Demo badge.

## TypeScript and code quality

- Keep TypeScript strict and honor `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.
- Type optional props as `?: T | undefined` when callers may explicitly pass `undefined`; guard indexed reads.
- Follow existing component, naming, formatting, and localization patterns.
- Prefer a focused change and existing helpers over new abstractions or unnecessary dependencies.
- Surface meaningful failures through the existing application error handling; do not silently swallow errors.

## Validation

- Run relevant tests with `npm test`.
- Run `npm run build` after source or configuration changes.
- Exercise affected routes and interactions when changing navigation or screen behavior.
- Run focused lint on changed files when repository-wide lint has pre-existing issues; report those issues separately rather than reformatting unrelated files.
- Do not claim a check passed unless it was run.

## Future service replacements

The demo services are an intentional local implementation, not a backend emulator. A future backend adapter should preserve typed service boundaries where practical, keep screen components decoupled from vendor SDKs, and make persistent behavior, errors, loading states, and authorization explicit.
