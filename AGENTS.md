# AGENTS.md — Contributor & AI Agent Guide

> This file provides context and ground rules for both human contributors and AI coding agents (e.g., Kiro, Copilot, Cursor, Claude) working on this repository.

---

## Project Overview

**Dapper Styles Booking** is a men's grooming and barbershop booking platform. It supports:

- Appointment booking for haircuts, fades, beard styling, and grooming services
- Monthly subscription plans for salon owners
- A premium, style-focused UI built around men's hairstyle and beauty themes

**Tech stack:**

| Layer | Technology |
|---|---|
| Framework | React 19 + TanStack Start (TanStack Router + TanStack Query) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives + shadcn/ui |
| Backend / Auth / DB | Supabase |
| Forms | React Hook Form + Zod |
| Build | Vite 8 |
| Package Manager | Bun |


## Local Development

```sh
# Prerequisites: Node.js (via nvm) or Bun
git clone <this-repository-url>
cd style-sessions-pro

bun install       # or: npm install
bun run dev       # or: npm run dev
```

Other useful commands:

```sh
bun run build       # Production build
bun run build:dev   # Development build (useful for debugging)
bun run preview     # Preview the production build locally
bun run lint        # Run ESLint
bun run format      # Run Prettier
```

---

## Repository Structure

```
src/
├── assets/            # Static images (hero, service photos)
├── components/
│   ├── ui/            # shadcn/ui primitives — do not customize directly
│   └── *.tsx          # App-level components (SiteHeader, SiteFooter, etc.)
├── hooks/             # Custom React hooks
├── integrations/
│   └── supabase/      # Supabase client, auth helpers, generated types
├── pages/             # Route-level page components
└── lib/               # Shared utilities
```

---

## Code Conventions

### General

- All new code must be in **TypeScript** — no plain `.js` files.
- Use `zod` for all runtime validation and form schemas.
- Prefer `react-hook-form` for all form state; avoid uncontrolled inputs.
- Use TanStack Query for all server state. Do not use `useState` + `useEffect` for data fetching.

### Components

- Place route-level views in `src/pages/`.
- Place shared UI components in `src/components/`.
- Do **not** modify files under `src/components/ui/` directly — these are managed by shadcn/ui. Extend them by wrapping in a new component.
- Use `lucide-react` for icons. Do not add a second icon library.

### Styling

- Use Tailwind utility classes exclusively. Avoid inline `style` props unless absolutely required.
- Follow the existing color/theme tokens — do not hardcode hex values.
- The app targets **men's grooming aesthetics**: dark tones, sharp typography, premium feel. Keep new UI consistent with this direction.

### Supabase

- All Supabase interactions go through `src/integrations/supabase/`.
- Use Row Level Security (RLS) for all tables — never disable RLS as a workaround.
- Do not expose service role keys or secrets in client-side code.

---

## Git Workflow

1. Create a feature branch from `main`: `git checkout -b feat/your-feature-name`
2. Keep commits small and focused. Use [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `chore:` — tooling, deps, config
   - `refactor:` — code restructure without behavior change
   - `docs:` — documentation only
3. Open a PR against `main`. Ensure the build passes before merging.
4. **Never** force-push or amend commits already pushed to `main`.

---

## For AI Agents

If you are an AI agent working in this repository, follow these rules in addition to everything above:

- **Read before writing.** Always read relevant existing files before creating or modifying code. Match the project's patterns, naming, and libraries — do not introduce new dependencies without a clear reason.
- **No new dependencies without justification.** The stack is intentional. If a task can be done with an existing library, use it.
- **Do not touch `src/components/ui/`.** These are auto-generated shadcn/ui components. Wrap them; don't edit them.
- **Preserve Supabase RLS.** Never disable or bypass Row Level Security.
- **Keep `main` green.** Only generate code that compiles and does not break existing functionality.
- **Scope your changes.** Fix what was asked. Don't refactor unrelated files as a side effect.
- **No secrets in code.** Environment variables belong in `.env` (gitignored). Reference `import.meta.env.VITE_*` variables; never hardcode credentials.
- **Respect Lovable sync.** Do not rewrite git history on `main`. Commits flow back to Lovable — broken history means a broken project for the owner.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Never commit `.env` — it is listed in `.gitignore`.

---

## Questions / Issues

Open an issue or reach out via the [Lovable editor](https://lovable.dev/projects/3de3c266-1cdc-4563-9cc8-ddb8e0ffd0fa) if you're unsure about project direction or conventions.
