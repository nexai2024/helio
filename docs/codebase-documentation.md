# Helio Codebase Documentation & Strategic Analysis

This document provides a comprehensive technical and business analysis of **Helio**, an open-source, AI-native growth and marketing automation platform. It is written for software engineers onboarding to the codebase as well as technical decision-makers evaluating its product scope and architecture.

---

## Part 1 — Product & Business Analysis

### Intended App Purpose & Core Value Proposition

Helio is an open-source, self-hosted growth and marketing automation platform (CDP + CRM + Campaign & Journey Orchestration + AI Copilot).

- **Core Value Proposition**:
  - **Data Sovereignty & Zero Per-Contact Fees**: Unlike SaaS marketing platforms (e.g., HubSpot, Klaviyo, Customer.io) that charge escalating monthly fees per contact tier, Helio is self-hosted and free forever with no artificial contact caps.
  - **Unified CDP & CRM**: Customer data, behavioral event streams, email/SMS/WhatsApp communications, and sales pipelines (deals, tasks, meetings) reside in a single Postgres + ClickHouse datastore.
  - **AI-Native Marketing Operations**: Integrates bring-your-own AI keys (OpenAI, Anthropic, Groq, NVIDIA NIM, Ollama, local models) and custom ML models (ONNX, XGBoost) directly into audience segmentation, campaign generation, predictive lead scoring, churn prediction, and send-time optimization.
  - **Multi-Tenant & Enterprise-Ready Architecture**: Built from the ground up with PostgreSQL Row-Level Security (RLS), single sign-on (SSO via OIDC/SAML), SCIM 2.0 provisioning, and an AES-256-GCM encrypted credential vault.

---

### Personas and Target Audience

#### Primary Personas

1. **Growth Marketers & Lifecycle Campaign Managers**
   - _Needs_: Visual segment builder, block-based email & landing page creation, multi-channel journey automation (email, SMS, WhatsApp, push, in-app), and real-time engagement analytics without needing SQL expertise.
2. **Growth Engineers & Developers**
   - _Needs_: Clean HTTP tracking APIs (Segment/RudderStack compatible), JS/TS SDKs, Python SDK, OpenAPI 3.1 gateway, outbound webhooks, fast self-hosting setup via Docker/CLI, and predictable event ingestion.
3. **Sales Representatives & Account Executives**
   - _Needs_: Kanban deal boards, task management, meeting scheduling with timezone-aware booking pages, contact notes, and activity histories.

#### Secondary Personas

1. **Data Engineers & ML Engineers**
   - _Needs_: SQL Explorer for direct query access to ClickHouse event streams, BYO model support (ONNX / XGBoost / HTTP predict endpoints) for churn & conversion scoring, and exportable CSV training data.
2. **IT & System Administrators**
   - _Needs_: One-command installer CLI, multi-tenant organization isolation, audit logging, TOTP 2FA, password expiry enforcement, automated database backups, and health monitoring.

---

### Feature Inventory

#### Totally Implemented (Fully Functional and Integrated)

- **Multi-Tenant Security & Isolation**: Better-Auth organization management with PostgreSQL RLS (`app.current_organization_id`), RBAC (`owner`, `admin`, `editor`, `viewer`), TOTP 2FA, Password Expiry Policy, and Audit Trail.
- **CDP & Ingestion Engine**:
  - `@helio/sdk-js` browser tracking library and `@helio/sdk-py` client.
  - `/v1/batch` and `/v1/track|identify|page` write-key-authenticated ingestion streaming to Redpanda/Kafka and ClickHouse.
  - Segment/RudderStack compatible tracking payloads.
- **Segmentation & Audiences**:
  - Visual nested AND/OR condition builder (contact fields, JSON attributes, recency, event history, predictive metrics).
  - Always-live SQL query generator compiled in `@helio/core`.
- **Campaign & Multi-Channel Journey Orchestration**:
  - React Flow drag-and-drop journey canvas.
  - Temporal workflows (`JOURNEY_RUN_WORKFLOW`, `CAMPAIGN_SEND_WORKFLOW`) providing durable, fault-tolerant execution across Email, Twilio SMS, WhatsApp Cloud API, Web Push (VAPID), and In-App messages.
  - Deterministic send-deduplication rows (`EmailSend`, `JourneyDelivery`) ensuring double-sends are impossible on worker retries.
- **Email & Page Builders**:
  - Block-based email template editor with live preview, token interpolation (`{{token|fallback}}`), RFC 8058 one-click unsubscribe, and hosted image asset storage (`EmailAsset`).
  - Block-based landing page editor (`/p/<id>`) and hosted signup forms (`/f/<id>`).
  - On-site widget embeds (`/widget.js`) supporting popups and banners.
- **Deliverability Suite**:
  - DKIM key pair generator (RSA), SPF record checker, DMARC record checker, live DNS verification.
- **AI Copilot & Intelligence Suite**:
  - Bring-Your-Own LLM credentials (OpenAI, Anthropic, Groq, NVIDIA NIM, Ollama).
  - Natural language to Segment rule generator, natural language to Journey generator, email copy generator.
  - Predictive lead scoring and churn probability model execution.
  - Bring-Your-Own Churn Model (ONNX, XGBoost JSON, or HTTPS prediction endpoint) running inside a sandbox environment.
  - FastMCP server (`apps/intelligence/src/helio_intelligence/mcp_server`) exposing tools for AI agents.
  - Send-time optimization (STO) calculating `bestSendHour` per contact.
  - Autonomous A/B test winner selection based on statistical open/click rates.
- **CRM-Lite**:
  - Multi-pipeline Kanban deal board with stage management and value tracking in minor currency units (cents).
  - Task manager (TODO, CALL, EMAIL, MEETING) with due-date grouping and assignees.
  - Meeting scheduler with public booking pages (`/b/<slug>`), timezone-correct slot generation, and double-booking prevention.
  - B2B Company/Account objects and contact/deal notes.
- **Analytics & Reporting**:
  - ClickHouse event funnels (`windowFunnel`), weekly cohort retention grids, and multi-touch attribution models (First-touch, Last-touch, Linear).
  - Fenced SQL Explorer with read-only AST parsing and row/time limits via `@helio/core`'s `guardAnalyticsQuery`.
- **Integrations & Import Suite**:
  - Importers for HubSpot, Mailchimp, Klaviyo API & CSV exports.
  - Shopify store integration with HMAC-verified webhooks (`customers/create`, `orders/create`).
  - Salesforce lead push integration (`pushSalesforceLead`).
  - Outbound webhook dispatch with HMAC-SHA256 signing and durable Temporal retry workflows.
- **Admin & Infrastructure Operations**:
  - `helio` CLI tool (Commander) for Docker lifecycle, status checks, logs, updates, and backup/restore.
  - Self-hosted database backup sidecar (`BackupRun`, `BackupRequest`).
  - In-app Database Studio with schema-validated write guards.
  - Enterprise SSO (OIDC/SAML) and SCIM 2.0 user provisioning endpoints (`/scim/v2`).

#### Partially Implemented (Incomplete, Buggy, or Limited Scope)

- **Mobile / PWA Native Notifications**:
  - _Status_: PWA manifest and service worker exist (`apps/web/public/sw.js`), but background push notification handling and badge syncing are basic fallback implementations `<uncertain>`.
- **Database Studio Custom Query Runner**:
  - _Status_: Database Studio allows model-level updates with validation guards, but arbitrary query executions outside pre-defined models are intentionally restricted `<uncertain>`.

#### Not Implemented (Shell Files, Stubs, or Design-Only Artifacts)

- **Ad-Audience Sync (Google Ads / Meta Ads / LinkedIn Ads)**:
  - _Status_: Listed on the high-level product roadmap (Milestone 🗺️), but no code, API adapters, or background sync jobs exist in the codebase `<uncertain>`.

---

### Competitive Assessment

| Dimension                 | Helio                                                                          | HubSpot / Klaviyo / Customer.io                | Mautic                            |
| :------------------------ | :----------------------------------------------------------------------------- | :--------------------------------------------- | :-------------------------------- |
| **Pricing Model**         | Free forever, self-hosted, $0 per contact                                      | Tiered pricing per contact ($890+/mo at scale) | Open-source, self-hosted          |
| **Architecture / Stack**  | Next.js 15, Fastify, Temporal, ClickHouse, Redpanda, Postgres, Python          | Proprietary cloud SaaS                         | PHP / Symfony, MySQL, Cron-based  |
| **Data Sovereignty**      | 100% self-hosted; customer data stays on premises                              | Vendor cloud lock-in                           | Self-hosted                       |
| **AI Integration**        | Native BYO-key LLM Copilot, BYO ML model sandbox, MCP agent server             | Add-on SaaS AI features                        | Limited / community plugins       |
| **Execution Reliability** | Temporal workflows with durable execution and deterministic send-deduplication | Enterprise SaaS queueing                       | Cron jobs / PHP background queues |

#### Path to Market Leadership

1. **Native Ad-Platform Audience Sync**: Build direct API integrations for Google Customer Match, Meta Custom Audiences, and LinkedIn Matched Audiences.
2. **Visual Drag-and-Drop Form & Page Builder**: Upgrade landing page and hosted form builders with freeform block positioning and styling.
3. **Advanced Workflow Triggers & Loop Control**: Support complex branching, multi-path loops, and custom webhook-driven journey triggers.

---

### Implementation & Go-Live Plan

_Note: All resource and duration estimates provided below are best-effort inferences based on codebase size and technical complexity._ `<uncertain>`

```
[Phase 1: Foundation (Weeks 1-2)] -> [Phase 2: Validation (Weeks 3-4)] -> [Phase 3: Pilot Launch (Weeks 5-6)] -> [Phase 4: General Availability (Weeks 7+)]
```

#### Phase 1: Infrastructure & Core Provisioning (Weeks 1–2)

- **Key Milestones**:
  - Deploy core infrastructure using Docker Compose or Helm Chart (`infra/helm/helio`).
  - Provision PostgreSQL 16 (with `pgvector`), ClickHouse, Redpanda, Redis, and Temporal.
  - Run initial migrations (`task db:migrate` and `task ch:migrate`).
  - Configure environment variables, master encryption key (`HELIO_ENCRYPTION_KEY`), and initial admin organization.
- **Resource Estimate**: 1 Senior DevOps / Infrastructure Engineer (80 hours) `<inference>`.

#### Phase 2: Integration & Channel Setup (Weeks 3–4)

- **Key Milestones**:
  - Connect primary messaging channels in Settings (SMTP / Postmark / Resend, Twilio SMS, WhatsApp Cloud API).
  - Configure BYO AI Provider (OpenAI / Anthropic / Ollama) and test Copilot draft generation.
  - Setup DKIM, SPF, and DMARC DNS records for sending domains and complete DNS verification in Helio.
  - Embed `@helio/sdk-js` into primary web applications or point Segment/RudderStack HTTP tracking to `/v1/batch`.
- **Resource Estimate**: 1 Full-Stack Engineer + 1 Lifecycle Marketer (120 combined hours) `<inference>`.

#### Phase 3: Data Migration & Journey Verification (Weeks 5–6)

- **Key Milestones**:
  - Execute contact and suppression list imports via CSV or HubSpot/Mailchimp API connectors.
  - Build core audience segments and verify live query performance.
  - Create and test automated Welcome, Re-engagement, and Abandoned Cart Journeys in staging mode.
  - Conduct load testing with `k6` harness (`infra/k6`) to verify ingestion capacity.
- **Resource Estimate**: 1 QA Engineer + 1 Data Engineer (100 combined hours) `<inference>`.

#### Phase 4: Production Launch & Operations (Weeks 7+)

- **Key Milestones**:
  - Activate live journeys and scheduled campaigns.
  - Enable automatic scheduled database backups via `BackupRun` sidecar.
  - Monitor real-time system alerts (`SystemAlert`), ClickHouse ingestion lag, and Temporal worker health.
- **Resource Estimate**: 0.5 DevOps / Reliability Engineer (ongoing maintenance) `<inference>`.

---

## Part 2 — Technical Documentation

### Overview & Architecture

Helio is structured as a TypeScript/Python monorepo managed via `pnpm` workspaces and `Turborepo`.

```
                        +---------------------------------------+
                        |      Client (Browser / PWA / App)      |
                        +---------------------------------------+
                                   |                 |
                   Tracking SDK / Embeds        Next.js Dashboard
                                   |                 |
                                   v                 v
                        +--------------------+  +--------------------+
                        |  Ingest Service    |  |   Next.js BFF      |
                        |   (Fastify:4100)   |  |   (tRPC Routers)   |
                        +--------------------+  +--------------------+
                           |             |         |              |
                      Write Key Cache    |         |        Prisma Client
                           v             v         v        (App RLS Role)
                       (Redis)     (Redpanda/Kafka) |              |
                                         |         |              v
                                         v         |     +--------------------+
                                   +-----------+   |     | PostgreSQL 16 +    |
                                   | ClickHouse|   |     |      pgvector      |
                                   +-----------+   |     +--------------------+
                                         ^         |              ^
                                   Analytics Queries              |
                                         |         |              |
                                         +----+----+              |
                                              |                   |
                                              v                   v
+------------------------+             +--------------------------------------+
| Intelligence Service   | <---------> |        Workers & Temporal            |
| (Python/FastAPI:8000)  |  HTTP/REST  |  (Campaigns, Journeys, Deliveries)   |
+------------------------+             +--------------------------------------+
```

- **Frontend / BFF (`apps/web`)**: Next.js 15 app router with tRPC API endpoints, Better-Auth session handling, React Flow canvas, and Tailwind CSS UI components.
- **REST Gateway (`apps/api`)**: Fastify REST server serving OpenAPI 3.1 endpoints with scoped API key authentication (`GatewayApiKey`), rate limiting, and problem+json error formatting.
- **Ingestion Engine (`apps/ingest`)**: High-throughput Fastify server validating write keys via Redis, pushing event batches into Redpanda (Kafka), which are then consumed into ClickHouse.
- **Tracking Gateway (`apps/tracking`)**: Serves open tracking pixels (`/t/open/...`) and click redirection links (`/t/click/...`) signed with HMAC-SHA256, recording engagement events into Redpanda/ClickHouse.
- **Background Processing & Orchestration (`apps/workers`)**: Temporal workflows and activities executing campaign email sends, journey state machines, delivery retries, and outbound webhook dispatches.
- **Intelligence Service (`apps/intelligence`)**: Python FastAPI application hosting LLM copilot integrations, predictive lead scoring, custom ONNX/XGBoost model execution sandbox, and FastMCP agent server.

---

### Component Breakdown

#### 1. Core Domain Library (`packages/core`)

- **Purpose**: Houses pure, framework-agnostic business logic, Zod validation schemas, cryptographic utilities, and query generation logic shared across node services.
- **Internal Mechanics**:
  - `segments.ts`: Compiles visual nested segment conditions into raw SQL `WHERE` predicates over contacts and ClickHouse behavioral event tables.
  - `sql-guard.ts`: Enforces a strict read-only SQL AST parser using `pgsql-ast-parser`, ensuring analytics SQL queries cannot execute data-modifying operations or cross tenant boundaries.
  - `crypto-envelope.ts`: Implements AES-256-GCM envelope encryption (`enc:v1`) for third-party credentials and secrets bound to row IDs.
  - `email-doc.ts`: Schema definition and HTML compilation for block-based emails, including safe token interpolation (`{{token|fallback}}`).

#### 2. Database & Data Layer (`packages/db`)

- **Purpose**: Prisma ORM schema, migrations, RLS policy definitions, and Database Studio validation logic.
- **Internal Mechanics**:
  - Uses dual connection pools: an admin connection (`DATABASE_ADMIN_URL`) for migrations and Better-Auth internal tables, and an unprivileged application connection (`DATABASE_URL`) bound to the `helio_app` role.
  - Multi-tenancy is enforced at the database level using PostgreSQL Row-Level Security:
    ```sql
    SET LOCAL app.current_organization_id = 'org_xxx';
    ```
  - `prisma.config.ts` initializes custom driver adapters to safely execute transaction-local RLS scopes.

#### 3. Frontend Dashboard & BFF (`apps/web`)

- **Purpose**: Operator UI for campaigns, journeys, CRM, settings, and analytics.
- **Internal Mechanics**:
  - tRPC routers in `apps/web/src/trpc/routers` map directly to product domains (`contact.ts`, `journey.ts`, `campaign.ts`, `crm.ts`, `copilot.ts`, etc.).
  - Middleware (`apps/web/src/trpc/init.ts`) resolves session authentication, verifies organization membership, and sets the transaction-local Postgres RLS variable prior to running Prisma queries.

#### 4. Event Ingestion Pipeline (`apps/ingest`)

- **Purpose**: Accepts high-volume analytics events from `@helio/sdk-js` and tracking HTTP endpoints.
- **Internal Mechanics**:
  - Ingests JSON batches at `/v1/batch` and single calls at `/v1/track`, `/v1/identify`, `/v1/page`.
  - Validates the write key against Redis (`writekey:<key>`); on cache miss, queries Postgres.
  - Enriches events with tenant identifiers (`organization_id`, `workspace_id`) and writes directly to Redpanda topics. A background consumer drains Redpanda into ClickHouse tables in micro-batches.

#### 5. Durable Orchestration Workers (`apps/workers`)

- **Purpose**: Executes time-sensitive, stateful background workflows.
- **Internal Mechanics**:
  - Temporal TypeScript SDK connects to the Temporal server using task queue `helio-sends`.
  - `JOURNEY_RUN_WORKFLOW`: Manages state machine transitions for contacts enrolled in journeys, supporting wait timers, event triggers, branch evaluations, and channel delivery nodes.
  - `CAMPAIGN_SEND_WORKFLOW`: Enumerates audience contacts, checks deliverability status and suppressions, and creates deterministic `EmailSend` records before dispatching via native email adapters.

#### 6. Intelligence & ML Service (`apps/intelligence`)

- **Purpose**: Python FastAPI service providing AI copy generation, lead scoring, and custom ML execution.
- **Internal Mechanics**:
  - Uses `langchain` / `langchain-community` to connect to configured LLM providers using the decrypted API keys supplied per-request in encrypted headers.
  - Loads custom uploaded ONNX / XGBoost models inside isolated Python process environments, mapping input traits to output conversion and churn probability scores.
  - Runs a FastMCP server (`mcp_server`) exposing tool definitions for external LLM agents.

---

### Data Flow

#### Event Ingestion & Analytics Flow

```
[Browser / SDK]
       |  POST /v1/batch (x-write-key)
       v
[apps/ingest (Fastify)] ---> [Redis Cache (Key Validation)]
       |
       | Enriched Event (org_id, workspace_id, event, timestamp)
       v
[Redpanda / Kafka Topic]
       |
       | Consumer Stream
       v
[ClickHouse (events table)]
       ^
       | SQL Funnel / Retention / Attribution Queries
[apps/web (tRPC / Analytics Router)]
```

#### Campaign & Journey Message Delivery Flow

```
[Operator triggers Campaign / Journey Event occurs]
       |
       v
[apps/workers (Temporal Workflow)]
       |
       +---> Check Contact Status (Must be ACTIVE)
       |
       +---> Acquire Deterministic Send Lock (EmailSend / JourneyDelivery)
       |
       +---> Render Template & Interpolate Tokens (packages/emails)
       |
       +---> Fetch Decrypted Credentials from Vault (packages/core)
       |
       +---> Send via Provider (SMTP / Postmark / Resend / Twilio / WhatsApp)
       |
       v
[Recipient Inbox / Phone]
       |  Clicks link or opens pixel
       v
[apps/tracking (Fastify)]
       |
       v  Record Engagement Event
[Redpanda -> ClickHouse]
```

---

### Dependencies & External Services

| Dependency                   | Category         | Role in Helio                                                           |
| :--------------------------- | :--------------- | :---------------------------------------------------------------------- |
| **PostgreSQL 16 + pgvector** | Database         | Primary relational datastore, RLS tenant isolation, vector embeddings   |
| **ClickHouse**               | Analytics DB     | High-speed columnar storage for raw event streams, funnels, and cohorts |
| **Redpanda (Kafka)**         | Event Streaming  | Distributed append-only log buffering event ingestion before ClickHouse |
| **Temporal**                 | Workflow Engine  | Orchestrates durable campaign sends, journey wait timers, and webhooks  |
| **Redis**                    | In-Memory Cache  | Fast write-key validation, rate limiting counters, session locks        |
| **Better-Auth 1.6**          | Auth Framework   | Authentication, organization plugin, TOTP 2FA, API keys, SSO            |
| **Prisma 7**                 | ORM              | Database modeling, schema management, driver adapter interface          |
| **Fastify**                  | HTTP Framework   | High-performance HTTP server for `api`, `ingest`, and `tracking`        |
| **Next.js 15 + tRPC**        | Web Framework    | Full-stack web dashboard, Server Components, typed RPC endpoints        |
| **Temporal SDK**             | Workflow Client  | TypeScript background worker runtime for long-running workflows         |
| **FastAPI + PyTorch/ONNX**   | Python ML Engine | Intelligence service, scoring runtime, custom model sandbox             |

---

### Key Functions & Classes

#### Cryptographic Vault (`packages/core/src/crypto-envelope.ts`)

```typescript
export function encryptField(plaintext: string, key: Buffer, scope: VaultScope): string;
```

- **Parameters**: `plaintext` (secret string), `key` (32-byte master encryption key), `scope` (`{ organizationId, recordId }`).
- **Return Value**: Encrypted envelope string in format `enc:v1:<fingerprint>:<nonce>:<ciphertext>:<tag>`.
- **Side Effects**: Binds the ciphertext to the specific organization and row ID using AES-256-GCM additional authenticated data (AAD). Ciphertext replayed in another row or organization fails decryption.

```typescript
export function decryptField(envelopeStr: string, key: Buffer, scope: VaultScope): string;
```

- **Parameters**: `envelopeStr` (envelope string), `key` (master key), `scope` (`{ organizationId, recordId }`).
- **Return Value**: Decrypted plaintext string.
- **Side Effects**: Throws `VaultDecryptError` or `VaultFormatError` if authentication tags or scopes mismatch.

#### SQL Query Guard (`packages/core/src/sql-guard.ts`)

```typescript
export function guardAnalyticsQuery(
  rawSql: string,
  tenantScope: { organizationId: string; workspaceId: string },
): Result<string, HelioError>;
```

- **Parameters**: `rawSql` (user-supplied SQL string), `tenantScope` (tenant isolation parameters).
- **Return Value**: `Ok(sanitizedSql)` or `Err(HelioError)`.
- **Side Effects**: Parses SQL into an AST using `pgsql-ast-parser`. Rejects non-`SELECT` statements, multi-statement queries, access to non-analytics tables, and injects mandatory `organization_id` and `workspace_id` equality filters.

#### Segment Rule Compiler (`packages/core/src/segments.ts`)

```typescript
export function buildSegmentWhereClause(
  rule: SegmentRuleGroup,
  params: Record<string, unknown>,
): string;
```

- **Parameters**: `rule` (nested AND/OR condition tree), `params` (SQL query parameters object).
- **Return Value**: Parameterized SQL `WHERE` string segment.
- **Side Effects**: Safely formats conditions against contact fields, JSON attributes, recency, and ClickHouse behavioral event subqueries without risk of SQL injection.

---

### Edge Cases, Gotchas, and Error Handling

1. **PostgreSQL RLS Transaction Isolation**:
   - _Gotcha_: Prisma queries executing on the `DATABASE_URL` role MUST set `app.current_organization_id` in the SAME database transaction. Executing queries without setting this parameter returns zero rows due to default RLS policies.
   - _Code Safeguard_: `apps/web/src/trpc/init.ts` enforces `prisma.$transaction` wrapping for all tenant-scoped operations.

2. **Durable Temporal Workflow Retries & Send Deduplication**:
   - _Gotcha_: If a Temporal worker crashes immediately after an email or SMS is dispatched to a third-party gateway, Temporal retries the activity.
   - _Code Safeguard_: Before executing the send network request, the activity claims a unique record in `EmailSend` (unique constraint on `[campaignId, contactId]`) or `JourneyDelivery` (unique constraint on deterministic `id`). If the row already exists with status `SENT`, the retry short-circuits safely.

3. **Custom Model Upload Sandboxing**:
   - _Gotcha_: Uploading arbitrary Python pickle files allows remote code execution.
   - _Code Safeguard_: In `packages/core/src/churn-model.ts` and `apps/intelligence/src/helio_intelligence/model_runtime/sandbox.py`, `.pkl` and `.pickle` files are explicitly rejected by design. Only `.onnx` and `.json` (XGBoost) formats are allowed and parsed in locked-down environments.

4. **SSRF Guard on Webhooks & Probes**:
   - _Gotcha_: Outbound webhooks or deliverability DNS/HTTP probes supplied by operators could target internal networks (e.g. `http://169.254.169.254` or `http://localhost:3000`).
   - _Code Safeguard_: `assertPublicUrl` in `packages/core/src/ssrf.ts` resolves IP addresses prior to HTTP requests and blocks private, loopback, link-local, and cloud metadata IP ranges.

---

### Testing Strategy

#### Existing Tests

- **Unit Tests (`packages/core`)**: Vitest unit test suite covering segment rule compilation, SQL AST guarding, AES-256-GCM crypto envelope encryption, email rendering, deliverability DNS checks, and rate limiting (`428 passed`).
- **Integration Tests (`apps/ingest`, `apps/workers`, `packages/db`)**: Vitest integration tests using Testcontainers to spin up real PostgreSQL, ClickHouse, and Redpanda instances.
- **End-to-End Tests (`apps/web`)**: Playwright E2E suite testing full operator workflows from signup, organization creation, contact import, campaign dispatch, to journey execution.
- **Load Testing (`infra/k6`)**: k6 load test scripts measuring ingestion throughput and ClickHouse lag up to 20,000 events/second.

#### Recommendations for Test Improvements

1. **Mock-Based Ingestion Integration Tests**: Provide lightweight mock-backed integration tests for `apps/ingest` and `apps/workers` that do not require Docker overlayfs privileges, enabling full pipeline test execution inside restricted CI/CD container environments.
2. **Visual Regression Testing**: Add Playwright visual snapshot comparisons for the email template builder and landing page preview surfaces.

---

### Modification Guide for Developers

#### How to Add a New tRPC API Route in `apps/web`

1. Define the input/output Zod schemas in `packages/core` or inside the router.
2. Create a new router file in `apps/web/src/trpc/routers/<domain>.ts`.
3. Use `protectedProcedure` or `organizationProcedure` to automatically enforce authentication and tenant context.
4. Mount the new router in `apps/web/src/trpc/routers/_app.ts`.

#### How to Add a New Provider Credential Type

1. Add the new credential enum value to `ProviderCredentialKind` in `packages/db/prisma/schema.prisma`.
2. Add the field configuration and secret definitions to `CREDENTIAL_KINDS` in `packages/core/src/credentials.ts`.
3. Implement the provider adapter interface in `apps/workers/src/` (e.g., `email-provider.ts` or `sms-provider.ts`).
4. Update the factory (`email-provider-factory.ts` or `messaging-provider-factory.ts`) to instantiate the new provider.

#### How to Add a New Journey Node Type

1. Add the node type schema to `journeyNodeSchema` in `packages/core/src/journeys.ts`.
2. Update the React Flow canvas rendering component in `apps/web/src/components/journeys/` to display the new node configuration UI.
3. Update `JOURNEY_RUN_WORKFLOW` and `journey-activities.ts` in `apps/workers/src/` to handle state execution for the new node type during workflow runs.

---

## Part 3 — Enhancements & New Feature Recommendations

### 15 Enhancements to Existing Features

1. **Enhanced Journey Visual Branching & Split Testing**
   - _Description_: Extend the React Flow journey canvas to support multi-branch percentage splits (e.g., 33/33/34 A/B/C paths) and conditional wait nodes based on relative contact activity.
2. **Dynamic Email Block Personalization Rules**
   - _Description_: Allow individual content blocks inside the email builder to display conditionally based on contact segment membership.
3. **Advanced ClickHouse Funnel Step Timeouts**
   - _Description_: Add configurable step-level time windows to event funnels in `analytics.ts` (e.g., Step 2 must occur within 15 minutes of Step 1).
4. **Enhanced CSV Column Auto-Mapping Intelligence**
   - _Description_: Improve `suggestColumnMapping` in `contacts.ts` using fuzzy Levenshtein distance matching and attribute type detection.
5. **Interactive Database Studio Query Inspector**
   - _Description_: Add table schema relationship visualization and index suggestions inside the admin Database Studio (`db-studio.ts`).
6. **Multi-Domain DKIM Selector Management**
   - _Description_: Expand `SendingDomain` deliverability management to support custom DKIM selectors beyond the default `helio` selector.
7. **Scoped API Key Expiry and IP Whitelisting**
   - _Description_: Add expiration dates and allowed IP CIDR ranges to `GatewayApiKey` records in `gateway-keys.ts`.
8. **Real-Time Webhook Delivery Logs & Replay UI**
   - _Description_: Provide an operator dashboard tab under Settings → Webhooks showing payload inspection, response HTTP status codes, and manual replay buttons.
9. **Granular Dashboard Layout Permissions**
   - _Description_: Allow organization owners to publish locked default dashboard widget layouts for specific member roles.
10. **Enhanced Custom Model Feature Mapping Validator**
    - _Description_: Run automated sample predictions against BYO ONNX/XGBoost models during upload validation to detect input matrix dimension mismatches.
11. **CRM Task Recurring Schedules**
    - _Description_: Support recurring sales tasks (daily, weekly, monthly) in `tasks.ts` for account follow-ups.
12. **Double Opt-In Form Workflows**
    - _Description_: Add optional double opt-in confirmation email dispatches to hosted form submissions (`Form`).
13. **Landing Page Custom Domain Support (CNAME Routing)**
    - _Description_: Allow organization landing pages to be served directly from operator CNAME records (e.g., `landing.example.com/p/<id>`).
14. **Selective Audit Log Exporting**
    - _Description_: Add CSV/JSON filtering and export capabilities to the admin audit log viewer (`admin.ts`).
15. **Send-Time Optimization (STO) Window Customization**
    - _Description_: Allow operators to define maximum wait bounds for STO (e.g., delay send by at most 12 hours to hit `bestSendHour`).

---

### 15 Net New Features

1. **Native Ad-Platform Audience Sync (Google, Meta, LinkedIn)**
   - _Description_: Automatically synchronize dynamic Helio segments into Google Customer Match, Meta Custom Audiences, and LinkedIn Matched Audiences.
2. **Visual Drag-and-Drop Form Builder**
   - _Description_: Upgrade hosted forms with a full drag-and-drop field builder, custom CSS variables, and multi-step form pages.
3. **In-App Notification Center & Bell Widget**
   - _Description_: Provide an embeddable React/JS widget that renders an in-app notification inbox inside the customer's web application.
4. **Interactive Lead Scoring Matrix & Decay Rules**
   - _Description_: Implement time-based score decay (e.g., subtract 5 points per week of inactivity) and explicit behavioral criteria matrices.
5. **Multi-Currency Sales Pipeline Conversion**
   - _Description_: Automatically fetch live exchange rates to display unified sales pipeline totals across deals created in different currencies.
6. **AI Autonomous Campaign Copy Generator & Winner Optimizer**
   - _Description_: Automatically generate 5 email subject line variants via LLM, run an automated sample test, and select the winning variant autonomously.
7. **Automated Churn Mitigation Journeys**
   - _Description_: Automatically enroll contacts into re-engagement workflows when their `churnRisk` predicted by the ML engine exceeds a configurable threshold.
8. **Contact Relationship Graphs & Account Mapping**
   - _Description_: Visualize organizational hierarchies and influence maps between contacts associated with the same B2B Company.
9. **Two-Way SMS & WhatsApp Inbox**
   - _Description_: Provide a unified customer service/sales chat UI for reps to read and reply to incoming SMS and WhatsApp messages directly in Helio.
10. **Custom Event Transformation Pipelines (V8 Sandbox)**
    - _Description_: Allow developers to write JavaScript event transformation snippets executed during ingestion to clean or reshape incoming telemetry.
11. **Native Mobile App (React Native / Expo)**
    - _Description_: Provide iOS and Android apps for sales reps to manage deals, tasks, and contact notes on the go.
12. **SSO Directory Sync via SCIM Push Notifications**
    - _Description_: Bi-directional user deprovisioning and role sync with Okta, Microsoft Entra ID, and Google Workspace.
13. **Real-Time Collaboration on Email & Journey Templates**
    - _Description_: Enable WebSocket-based multiplayer editing (Yjs / Liveblocks) on email templates and journey canvases.
14. **Custom Report Builder & Dashboard Exporting**
    - _Description_: Allow operators to construct custom chart widgets from ClickHouse event queries and export scheduled PDF reports via email.
15. **Helio Plugin & Extension Marketplace**
    - _Description_: Create a plugin architecture allowing third-party developers to package custom journey nodes, connectors, and dashboard widgets.
