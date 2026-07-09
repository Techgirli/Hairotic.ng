# CLAUDE.md — Hairotic.ng

This file gives Claude Code the context needed to work on Hairotic.ng consistently.
Read this before making changes. When in doubt, prefer the PRD, Technical
Specification, and Security Guide in `/docs` over assumptions.

## Project Overview

Hairotic.ng is a premium Nigerian hair ecommerce platform. Bold, trust-driven,
mobile-first. Single-seller storefront + admin back-office, 21 screens across
8 composable modules, built entirely on free/near-free cloud tiers — **no AWS**.

**Mission:** Help every woman express her boldest self through hair that turns
heads and never holds her back.

**Non-negotiable product constraint:** Guest checkout must always remain
possible. Never force account creation at any step.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Forms/validation | React Hook Form + Zod |
| Client state | Zustand |
| Backend | NestJS, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL via Neon (serverless) |
| Cache/sessions | Redis via Upstash |
| Media | Cloudinary |
| Auth | JWT (access + refresh) + bcrypt |
| Payments | Paystack |
| Email | Resend |
| Customer messaging | Meta WhatsApp Cloud API |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| DNS/CDN/WAF | Cloudflare |
| CI/CD | GitHub Actions |
| Error tracking | Sentry |
| Uptime | UptimeRobot |
| Package manager | npm (assumed — update this line if the project uses yarn/pnpm) |

## Repo Structure

```
hairotic-ng/
├── frontend/            # Next.js app (Vercel)
│   ├── app/              # App Router pages — 21 screens map here
│   ├── components/       # Shared UI (shadcn/ui + brand tokens)
│   ├── lib/               # API client, Zod schemas, utils
│   ├── store/             # Zustand stores
│   └── public/
├── backend/             # NestJS API (Render)
│   ├── src/
│   │   ├── auth/ users/ catalog/ cart/ checkout/
│   │   ├── payments/ orders/ reviews/ wishlist/
│   │   ├── notifications/ whatsapp/ analytics/ admin/
│   ├── prisma/schema.prisma + migrations/
│   └── test/
├── docs/                # PRD, Technical Spec, Security Guide, this roadmap
├── .github/workflows/   # CI/CD
└── docker-compose.yml   # Local Postgres + Redis only
```

## Module Boundaries (Backend)

One NestJS module per business capability. All run in a single deployable
service at MVP scale, but boundaries must stay clean enough to extract any
module into its own service later without a rewrite.

- `auth/` — registration, login, refresh, MFA, RBAC guards
- `catalog/` — products, variants, categories, collections, search
- `cart/` — guest (Redis) and account (Postgres) cart state
- `checkout/` — order creation, stock holds, idempotency
- `payments/` — Paystack init, webhook verification, refunds
- `orders/` — order lifecycle, status history, guest tracking
- `reviews/` — verified-purchase reviews and photo moderation
- `wishlist/` — saved products per customer
- `notifications/` — Resend transactional email
- `whatsapp/` — Meta WhatsApp Cloud API
- `analytics/` — event ingestion, funnel/report queries
- `admin/` — admin-only endpoints, stricter RBAC + audit logging

Never put business logic directly in controllers — controllers call services;
services hold logic and talk to Prisma.

## Commands

```bash
# Install
npm install

# Frontend (from /frontend)
npm run dev          # local dev server
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit

# Backend (from /backend)
npm run start:dev    # NestJS hot-reload
npm run build
npm run lint
npm run test         # unit tests
npm run test:e2e     # integration tests

# Database (from /backend)
npx prisma migrate dev      # local migration
npx prisma migrate deploy   # production migration (reviewed, never auto-applied)
npx prisma studio           # inspect data locally

# Local infra
docker-compose up -d        # Postgres + Redis containers for local dev
```

CI runs on every PR: lint → type-check → tests → Prisma migration dry-run
against a Neon preview branch. Merge to `main` triggers Vercel + Render deploy.

## Database Rules

- All monetary values stored as **integers in kobo** — never floats. Avoids
  rounding errors on prices/totals.
- `order_status_history` is **append-only** and is the single source of truth
  for both Admin Orders and customer-facing Order Tracking.
- `audit_logs` captures every admin/security-relevant mutation: actor,
  action, entity, before/after.
- Stock decrement on payment confirmation **must** use a transaction with
  `SELECT ... FOR UPDATE` row locking. This is how overselling is prevented
  under concurrent checkouts — do not remove or "simplify" this.
- Parameterized queries only, via Prisma. Never raw string-concatenated SQL.

## API Conventions

- REST, versioned under `/api/v1`.
- Cursor-based pagination on all list endpoints (`?cursor=`, `?limit=`).
- Every write endpoint validates against Zod (frontend) and class-validator
  (backend) schemas derived from the same shape where practical.
- Mutating endpoints that create financial records (checkout, refunds)
  require an `Idempotency-Key` header.
- Error shape is consistent: `{ statusCode, message, error, requestId }`.
- All admin routes require RBAC role checks in addition to authentication —
  enforced at the controller level, never only hidden in the frontend UI.

## Non-Negotiable Business Rules

These come directly from the PRD. Do not implement shortcuts around them,
even temporarily:

1. An order is only `paid` after Paystack **webhook signature verification**
   succeeds — never on client-side redirect alone.
2. Stock is decremented atomically, only on confirmed payment, using
   row-level locking.
3. Prices and totals are always recomputed **server-side** from the
   Catalog/Inventory source of truth. Client-submitted prices are never
   trusted.
4. Guest checkout must always remain possible.
5. Every order status transition writes an immutable
   `order_status_history` record.

## Security Baseline

Full detail lives in `/docs/Hairotic_Security_Guide.docx`. Every feature
assumes:

- HTTPS everywhere, enforced at the Cloudflare/Vercel edge.
- JWT access + refresh tokens as `httpOnly`, `Secure`, `SameSite=Strict`
  cookies.
- bcrypt password hashing, cost factor ≥12.
- RBAC enforced server-side for every admin endpoint.
- Mandatory MFA for all admin/staff accounts.
- Rate limiting via Upstash Redis on auth, checkout, contact-form, and
  review-submission endpoints.
- Server-side input validation on every mutating endpoint, regardless of
  frontend validation.
- No secrets in source control — environment variables only, scoped per
  environment (dev/staging/production).
- Never log PII or payment data in plaintext.

## What NOT to Build

Explicitly out of scope for MVP — don't add these speculatively:

- Native mobile apps
- AI-driven product recommendations or AR try-on
- Multi-vendor marketplace model (this is single-seller)
- Subscription/recurring billing, referral/affiliate program
- Any AWS service — use the stack table above instead
- Custom secrets manager, service mesh, or Kubernetes

## Build Order

Full detail in `/docs/Hairotic_10_Phase_Roadmap.docx`. Summary:

1. Foundation & infrastructure
2. Auth & RBAC + Admin Login
3. Catalog + Landing, Shop, Collections, Product Page
4. Cart & Checkout
5. Payments (Paystack)
6. Notifications & Order Tracking
7. Admin back-office core (Dashboard, Products, Inventory, Orders)
8. Trust & retention (Wishlist, Customer Dashboard, Reviews, Contact, FAQ)
9. Admin Analytics & Customer Management
10. Hardening, Blog, launch readiness

**Rule:** Should Have and Could Have screens do not start until every Must
Have acceptance criterion in prior phases passes. Don't jump ahead to more
interesting features (Blog, Analytics) while checkout/payment correctness is
still unverified.

## Coding Conventions

- TypeScript strict mode everywhere. No `any` without a documented reason.
- Functional React components only. Server Components by default; add
  `"use client"` only when interactivity requires it.
- Tailwind utility classes over custom CSS. Brand tokens (deep orange
  `#E56717`, charcoal `#222222`) should be defined once in the Tailwind
  config, not hardcoded per component.
- One NestJS module per business capability — do not add cross-module
  imports that bypass a module's public service interface.
- Prefer small, composable functions over large ones. If a service method
  exceeds ~40 lines, consider splitting it.
- Every new endpoint needs a corresponding test before it's considered done.

## Environment Variables (never commit real values)

```
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
CLOUDINARY_URL=
RESEND_API_KEY=
WHATSAPP_CLOUD_API_TOKEN=
SENTRY_DSN=
```

## When Making Changes

- Check `/docs` for the relevant screen's acceptance criteria before marking
  a feature complete — treat them as the literal definition of "done."
- If a change touches auth, payments, or PII, it needs a design review
  before implementation, not just a code review after.
- Never remove or weaken a security control (rate limiting, RBAC checks,
  webhook verification) to make a feature "work" faster. Flag the tension
  instead.
- If uncertain whether something is in scope, check the "What NOT to Build"
  section above before assuming.
