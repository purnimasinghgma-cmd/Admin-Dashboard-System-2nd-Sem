# Workspace

## Overview

Admin Dashboard System — a multi-role admin web app for an e-commerce ops team
(brand: NexusOps). Built on the Replit pnpm workspace monorepo with a shared
PostgreSQL backend, a React + Vite frontend, and codegen-driven API hooks.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle) for the API server, Vite for the web app

## Artifacts

- `artifacts/admin-dashboard` — React + Vite + Tailwind v4 + shadcn/ui frontend.
  Pages: Dashboard, Sales, Users, Products, Analytics, Settings. Uses Recharts
  for charts and a sidebar layout with a top bar that includes the role
  switcher (admin / manager / user) for the multi-role demo.
- `artifacts/api-server` — Express 5 API server. Routes: `/auth`, `/users`,
  `/products`, `/orders`, `/dashboard/*`.
- `artifacts/mockup-sandbox` — design canvas (unused for this build).

## Database

Tables (see `lib/db/src/schema/`):
- `users` — id, name, email, role (admin/manager/user), status, avatar, last_active_at, created_at
- `products` — id, name, sku, category, price, stock, created_at
- `orders` — id, order_number, customer info, product snapshot, amount, status, created_at
- `session` — single-row demo session storing the active role

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-admin-dashboard` — wipe + reseed demo data

## Role-based UI

The active demo role is stored server-side in the `session` table and exposed
through `GET /api/auth/me`. Switching roles via `POST /api/auth/switch-role`
updates the stored role and the frontend invalidates the current-user query so
the entire UI re-renders with the new permissions.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
