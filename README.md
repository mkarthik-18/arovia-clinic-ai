# Arovia Clinic AI

**Arovia Healthcare Dashboard**  
*Care that understands you.*

A standalone clinic dashboard with appointment, patient, doctor, service, availability, conversation, analytics, settings, and help screens. It currently runs on local demo data; no external database, authentication, WhatsApp, or AI service is connected.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Quality checks

```sh
npm test
npm run lint
npm run build
```

## Application architecture

- React, TypeScript, TanStack Start, and file-based TanStack Router routes
- Tailwind CSS v4
- Demo records and behavior in `src/services/demo`; edits are local to the running browser and are not persisted to a real database
- Integrations are intentionally inactive and display **Not connected**

Supabase, n8n/WhatsApp, and Gemini can be added later through secure backend workflows. API keys, service-role keys, and webhook secrets must not be placed in frontend code.
