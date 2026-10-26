# Project Task Register

This register distinguishes shipped demo capabilities from future work. It is a documentation snapshot, not an automated issue tracker.

## Current release — standalone demo

- [x] Remove Lovable-specific application build/runtime dependencies and metadata.
- [x] Configure Vite directly with the existing React, TanStack Start, and Tailwind stack.
- [x] Establish npm installation and lockfile workflow.
- [x] Retain the Arovia Clinic AI name, Arovia Healthcare Dashboard identity, Arovia Assistant name, tagline, and existing favicon.
- [x] Preserve all ten dashboard screens and the shared TanStack Router shell.
- [x] Keep sample records, demo workflows, reset behavior, and explicit disconnected-integration status.
- [x] Cover all ten dashboard route matches in routing tests.
- [x] Verify the production build, test suite, cold-start development server, and dashboard navigation.

## Future work — requires product approval

### Backend and patient data

- [ ] Confirm data ownership, clinic tenancy, retention, backup, migration, and privacy requirements.
- [ ] Define the Supabase schema, indexes, relationships, migrations, and row-level access policies for patients, doctors, services, schedules, appointments, conversations, and settings.
- [ ] Implement authenticated server-side data access and explicit loading, saving, validation, and error states.
- [ ] Enforce clinic authorization and appointment slot conflict checks on the server.
- [ ] Decide whether, when, and how demo data is converted or separated from real clinic records.

### Authentication and authorization

- [ ] Select and approve the production identity and sign-in flow.
- [ ] Define clinic roles, invitations, session lifecycle, account recovery, and route/API authorization.
- [ ] Replace disabled sign-in controls only after server-side auth and protected routes are implemented and tested.

### Messaging, automation, and AI

- [ ] Define WhatsApp Business onboarding, consent, templates, message retention, and human-handoff behavior.
- [ ] Specify and authenticate the n8n workflows and verify inbound webhook signatures.
- [ ] Define when Gemini is used, model/data handling, response safety, costs, timeouts, and fallbacks.
- [ ] Keep provider credentials and webhook secrets in a trusted server-side secret store.
- [ ] Add end-to-end tests using safe fixtures without sending real messages.

### Production readiness

- [ ] Approve hosting, domains, TLS, deployment pipeline, environment separation, and rollback strategy.
- [ ] Complete accessibility, responsive, browser compatibility, and performance reviews.
- [ ] Add operational monitoring, audit trails, incident response, and data recovery procedures.
- [ ] Review dependency advisories and resolve them through tested, scoped upgrades.
- [ ] Run the full production acceptance suite against the selected deployment environment.

## Validation commands

```sh
npm install
npm test
npm run lint
npm run build
npm run dev
```

The current test suite covers scheduling rules and route matching. Browser navigation across all ten dashboard pages and a clean development-server response were also manually/browser-tool verified during standalone cleanup; the runtime validation artifact is documented in the task session, not treated as a substitute for future CI.
