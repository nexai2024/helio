# Deliverable 1: Change Log & Architecture Overview

## Overview & High-Level Architecture

Helio is an open-source growth and marketing automation platform built as a monorepo. The core application is a Next.js 15 web application (`apps/web`) serving a full-featured user dashboard, API routes, and tRPC endpoints.

### Core System Services:

- **Web Dashboard (`apps/web`)**: Next.js 15 app router providing marketing automation UI, CRM capabilities, campaign management, and user settings.
- **REST Gateway (`apps/api`)**: Fastify REST API gateway authenticated via organization API keys.
- **Event Ingestion (`apps/ingest`)**: Event pipeline consuming real-time events into Kafka/Redpanda and ClickHouse.
- **Engagement Tracking (`apps/tracking`)**: Fastify service tracking pixel impressions, link redirects, and open rates.
- **Campaign Workers (`apps/workers`)**: Temporal activity workers orchestrating journey flows, email/SMS/WhatsApp/Push sends.
- **Intelligence Service (`apps/intelligence`)**: Python FastAPI AI copilot service providing natural language querying, campaign suggestions, and predictive lead scoring.

---

## Data Flow Across the System

1. **Inputs**:
   - Web Dashboard interactions (React frontend / tRPC / Next.js server actions).
   - Ingest API (`apps/ingest`) tracking events from client-side SDKs and webhooks.
   - External Webhooks (Shopify, Postmark, Twilio, Meta WhatsApp).

2. **Processing & Storage**:
   - **PostgreSQL (Prisma ORM)**: Operational store for accounts, organizations, workspace data, contacts, workflows, and campaign configurations. Uses PostgreSQL Row-Level Security (RLS) to enforce multi-tenant isolation across organizations.
   - **Redis**: Caching, session management, API rate limiting, and idempotency key locks.
   - **ClickHouse**: High-throughput analytics engine storing raw event logs, web tracking events, and engagement history.
   - **Temporal**: Statefully handles execution of complex campaign journeys, delays, and scheduled tasks.

3. **Outputs**:
   - Outbound transactional communications (Emails via SMTP/Postmark/Resend, SMS via Twilio, Web Push, WhatsApp).
   - Webhooks to client applications.
   - Real-time web analytics and campaign reports displayed in the Next.js dashboard.

---

## Service Connections & External Dependencies

| Dependency                  | Purpose                                       | Connection Variable  | Configured Host Fallback                                     |
| :-------------------------- | :-------------------------------------------- | :------------------- | :----------------------------------------------------------- |
| **PostgreSQL (App Role)**   | Primary operational store (RLS-enforced)      | `DATABASE_URL`       | `postgresql://helio_app:helio_app@localhost:5432/helio`      |
| **PostgreSQL (Admin Role)** | Migrations & DDL operations                   | `DATABASE_ADMIN_URL` | `postgresql://helio:helio_dev_password@localhost:5432/helio` |
| **Redis**                   | Rate limits, cache, idempotency               | `REDIS_URL`          | `redis://localhost:6379`                                     |
| **ClickHouse**              | Behavioral analytics & event store            | `CLICKHOUSE_URL`     | `http://localhost:8123`                                      |
| **Temporal**                | Journey orchestration & worker workflow       | `TEMPORAL_ADDRESS`   | `localhost:7233`                                             |
| **Intelligence Service**    | AI Copilot FastAPI Service                    | `INTELLIGENCE_URL`   | `http://localhost:8000`                                      |
| **API Gateway**             | Microservice health probes & REST APIs        | `API_URL`            | `http://localhost:4000`                                      |
| **Ingest Gateway**          | Microservice health probes & Ingest endpoints | `INGEST_URL`         | `http://localhost:4100`                                      |
| **Tracking Server**         | Microservice health probes & Click tracking   | `TRACKING_URL`       | `http://localhost:4200`                                      |

---

## Removals & Replacements

All containerization artifacts and Docker dependencies were removed so the application operates purely through environment-variable-driven network connections (e.g. Neon PostgreSQL, Upstash Redis, ClickHouse Cloud, Temporal Cloud).

### Key Files Removed:

1. **`.dockerignore`**: Removed container build context ignore file.
2. **`infra/compose/docker-compose.yml`**: Removed local docker compose development orchestration stack.
3. **`infra/compose/docker-compose.selfhost.yml`**: Removed self-host docker compose stack.
4. **`infra/docker/*.Dockerfile`**: Removed all container image build definitions (`web.Dockerfile`, `api.Dockerfile`, `ingest.Dockerfile`, `tracking.Dockerfile`, `workers.Dockerfile`, `intelligence.Dockerfile`, `migrate.Dockerfile`, `backup.Dockerfile`, `updater.Dockerfile`).
5. **`infra/docker/*` scripts**: Removed container-internal entrypoints (`migrate/entrypoint.sh`, `updater/updater.sh`, `backup/backup.sh`).

### CI/CD Workflow Modifications:

1. **`.github/workflows/ci.yml`**: Removed `docker compose` startup step prior to e2e test execution.
2. **`.github/workflows/release.yml`**: Removed `images` job that built and pushed container images to GitHub Container Registry (GHCR).

### Key Functions & Modules Affected:

- **`apps/web/src/lib/env.ts` (`createEnv`)**: Validates server-side environment variables for `apps/web`. Sourced directly from `process.env` with zero Docker coupling.
- **`apps/web/src/lib/auth.ts` (`createPrismaClient`)**: Connects to PostgreSQL using `DATABASE_ADMIN_URL` and `DATABASE_URL`.
- **`apps/web/src/lib/system-health.ts` (`getSystemHealth`)**: Probes Redis, Temporal, ClickHouse, and sibling APIs over standard network connections sourced from environment variables.
- **`apps/web/src/lib/clickhouse.ts`**: Instantiates ClickHouse client with credentials from `CLICKHOUSE_URL`, `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`.

---

---

# Deliverable 2: Implementation Guide

Follow these numbered, copy-pasteable setup steps to run the Helio Next.js dashboard from a clean environment without Docker.

### 1. Prerequisites

Ensure you have Node.js (>=20.9.0, Node 24 recommended) and `pnpm` installed on your machine.

```bash
node -v
corepack enable
corepack prepare pnpm@11.5.2 --activate
```

### 2. Provision External Managed Services

Provision the required cloud/external services and obtain their connection URLs:

1. **PostgreSQL**: Provision a PostgreSQL database (e.g. on [Neon](https://neon.tech), Supabase, or AWS RDS). Create an admin user/role and an app user/role.
2. **Redis**: Provision a Redis instance (e.g. on [Upstash Redis](https://upstash.com) or Redis Cloud).
3. **ClickHouse** _(Optional for analytics)_: Provision a ClickHouse database (e.g. [ClickHouse Cloud](https://clickhouse.com/cloud)).
4. **Temporal** _(Optional for automated journeys)_: Provision a Temporal namespace (e.g. [Temporal Cloud](https://temporal.io/cloud) or self-hosted server).

### 3. Environment Variable Configuration

Copy `.env.example` to `.env.local` or `.env` in the root directory:

```bash
cp .env.example .env.local
```

Populate the required variables in `.env.local`:

- **`DATABASE_URL`**: App connection string for PostgreSQL (e.g., `postgresql://helio_app:password@ep-cool-db.neon.tech/helio?sslmode=require`).
- **`DATABASE_ADMIN_URL`**: Admin connection string for PostgreSQL DDL migrations (e.g., `postgresql://helio_admin:password@ep-cool-db.neon.tech/helio?sslmode=require`).
- **`REDIS_URL`**: Network connection string for Redis (e.g., `rediss://default:password@upstash.io:6379`).
- **`BETTER_AUTH_SECRET`**: Random 32-byte hex key for session signing (`openssl rand -hex 32`).
- **`UNSUBSCRIBE_SECRET`**: Random 24-byte hex key for email unsubscribe HMAC tokens (`openssl rand -hex 24`).
- **`APP_URL`**: Public origin of the dashboard (defaults to `http://localhost:3000`).

### 4. Install Dependencies

Install all workspace dependencies using `pnpm`:

```bash
pnpm install
```

### 5. Run Database Migrations & Seed

Apply database migrations using `DATABASE_ADMIN_URL` and seed initial development data:

```bash
pnpm --filter @helio/db exec prisma migrate deploy
pnpm --filter @helio/db exec prisma db seed
```

### 6. Start the Next.js Web App

Start the Next.js application in development mode:

```bash
pnpm --filter @helio/web dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
