# Standalone Next.js Deployment Guide (No Docker Required)

This guide documents how to deploy **Aethera** as a traditional standalone Next.js application on cloud platforms such as Vercel, Railway, Render, AWS, or traditional Linux VMs without requiring local Docker containers or container management daemons.

---

## 1. Overview of Standalone Architecture

In a standalone Next.js deployment:

- **Frontend Dashboard & API (`apps/web`)**: Deployed directly as a Next.js 15 App Router application on any Node.js hosting platform (Vercel, Railway, Render, etc.).
- **External Managed Datastores**:
  - **PostgreSQL 16**: Managed database instance (e.g. Neon, Supabase, AWS RDS, Railway Postgres) configured with the `pgvector` extension.
  - **Redis**: Managed Redis instance (e.g. Upstash, Redis Enterprise, AWS ElastiCache) for rate limiting and write-key caching.
  - **ClickHouse**: Managed ClickHouse Cloud or self-hosted instance for real-time behavioral analytics streams.
  - **Temporal Cloud / Managed Temporal**: Cloud-managed workflow execution cluster for background campaign sends and multi-channel journeys.

---

## 2. Required Environment Variables

Configure the following environment variables on your deployment platform:

### Core Configuration

```env
# Database Connections
DATABASE_ADMIN_URL="postgresql://postgres:password@db.example.com:5432/helio?sslmode=require"
DATABASE_URL="postgresql://helio_app:password@db.example.com:5432/helio?sslmode=require"

# Security & Secrets
BETTER_AUTH_SECRET="your-32-byte-hex-secret"
HELIO_ENCRYPTION_KEY="your-32-byte-base64-encryption-key"
UNSUBSCRIBE_SECRET="your-32-byte-unsubscribe-secret"

# Public Site & API
NEXT_PUBLIC_APP_URL="https://app.aethera.online"
NEXT_PUBLIC_API_URL="https://api.aethera.online"
```

### External Service Connectors

```env
# Redis Cache & Rate Limiting
REDIS_URL="rediss://default:password@redis.example.com:6379"

# ClickHouse Analytics
CLICKHOUSE_URL="https://clickhouse.example.com:8443"
CLICKHOUSE_USER="default"
CLICKHOUSE_PASSWORD="your-clickhouse-password"

# Temporal Workflow Engine
TEMPORAL_ADDRESS="temporal.example.com:7233"
TEMPORAL_NAMESPACE="default"
```

---

## 3. Local Development & Deployment Steps

### Local Development (Without Docker)

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Configure `.env` file from template:
   ```bash
   cp .env.example .env
   ```
3. Run database migrations on your remote or local PostgreSQL instance:
   ```bash
   pnpm db:migrate
   ```
4. Start the Next.js development server:
   ```bash
   pnpm --filter @helio/web dev
   ```
5. Open `http://localhost:3000` in your web browser.

---

## 4. Deploying to Vercel

1. **Import Repository**: Connect your GitHub repository to Vercel.
2. **Root Directory**: Select `apps/web` as the root directory (or keep root with Turbo build).
3. **Build Command**: `pnpm --filter @helio/web build`
4. **Output Directory**: `.next`
5. **Environment Variables**: Add all required variables listed above under Project Settings → Environment Variables.
6. **Deploy**: Click Deploy to launch your production Next.js instance.
