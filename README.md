# Dapper Styles Booking

A men's grooming and barbershop booking platform. Supports appointment booking for haircuts, fades, beard styling, and grooming services, with monthly subscription plans for salon owners.

## Tech Stack

- **Framework**: React 19 + TanStack Start (TanStack Router + TanStack Query)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **UI**: Radix UI + shadcn/ui
- **Backend / Auth / DB**: Supabase
- **Forms**: React Hook Form + Zod
- **Build**: Vite 8

## Getting Started

### Prerequisites

- Node.js 20+ (via [nvm](https://github.com/nvm-sh/nvm)) or Bun

### Setup

```sh
git clone <this-repository-url>
cd style-sessions-pro
npm install        # or: bun install
```

Copy the environment file and fill in your Supabase credentials:

```sh
cp .env.example .env
```

```env
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-or-publishable-key>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

### Development

```sh
npm run dev        # starts Vite dev server at http://localhost:8080
```

### Other Commands

```sh
npm run build       # production build
npm run build:dev   # development build (useful for debugging)
npm run preview     # preview the production build locally
npm run lint        # ESLint
npm run format      # Prettier
```

## Project Structure

```
src/
├── assets/            # Static images
├── components/
│   ├── ui/            # shadcn/ui primitives (do not edit directly)
│   └── *.tsx          # App-level components
├── hooks/             # Custom React hooks
├── integrations/
│   └── supabase/      # Supabase client, auth middleware, generated types
├── lib/               # Shared utilities
├── routes/            # TanStack Router route files
├── router.tsx         # Router configuration
├── server.ts          # SSR entry point
└── start.ts           # TanStack Start middleware setup
```

## Contributing

See [AGENTS.md](./AGENTS.md) for code conventions, Git workflow, and guidelines for AI agents working in this repo.
