# eduAI365

**The Complete K-12 School Operating System** — Multi-tenant SaaS ERP for schools.

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0** | Done | Monorepo, Docker, API Gateway, shared packages |
| **Phase 1** | Done | Design system, UI components, Storybook |
| **Phase 2** | Done | Database, Auth, RBAC, Multi-tenancy |
| **Phase 3** | Done | Landing page + Super Admin portal |
| **Phase 4** | Done | School Admin portal + tenant API |
| **Phase 5** | Done | Academic operations |
| **Phase 6** | Done | Finance, fees, payments |
| **Phase 7** | Done | Role portals (teacher, student, parent) |
| **Phase 8** | Done | HR & workforce |
| **Phase 9** | Done | Campus operations (library, transport, health) |
| **Phase 10** | Done | Communication hub + in-app notifications |
| **Phase 11** | Done | Extended modules (assets, alumni, hostel, inventory) |
| **Phase 12** | Done | AI platform, copilot, predictions |
| **Phase 13** | Done | Reports hub + PDF generation |
| **Phase 14** | Done | Integrations (webhooks, GPS, QR, SMS/WhatsApp) |
| **Phase 15** | Done | i18n, DPDPA/GDPR compliance, PWA & accessibility |
| **Phase 16** | Done | CI/CD, E2E tests, production infra, launch readiness |

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker Desktop

### Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev:phase16   # API + all 7 web apps (full stack)
pnpm storybook     # optional — design system
```

Individual apps: `dev:api` (4000), `dev:landing` (3000), `dev:admin` (3001), `dev:school` (3002), `dev:teacher` (3003), `dev:student` (3004), `dev:parent` (3005)

Optional monitoring stack: `pnpm docker:monitoring` (Prometheus + Grafana)

See [docs/PHASE16.md](docs/PHASE16.md) for launch checklist and E2E tests.

### URLs

| Service | URL |
|---------|-----|
| Landing Page | http://localhost:3000 |
| Super Admin Portal | http://localhost:3001 |
| School Admin Portal | http://localhost:3002 |
| Teacher Portal | http://localhost:3003 |
| Student Portal | http://localhost:3004 |
| Parent Portal | http://localhost:3005 |
| API Gateway | http://localhost:4000 |
| Swagger Docs | http://localhost:4000/docs |
| Health Check | http://localhost:4000/api/v1/health |
| Storybook | http://localhost:6006 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| Loki | http://localhost:3100 |
| Prometheus | http://localhost:9090 *(monitoring profile)* |
| Grafana | http://localhost:3030 *(monitoring profile, admin / educore_grafana)* |

## CI/CD

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| [ci.yml](.github/workflows/ci.yml) | push/PR to `main`, `develop` | Lint, typecheck, build all apps, compose validate, optional E2E |
| [deploy-staging.yml](.github/workflows/deploy-staging.yml) | push to `develop`, manual | Staging image build + K8s deploy skeleton |
| [a11y.yml](.github/workflows/a11y.yml) | student/parent UI changes | Lighthouse accessibility stub |

## Monorepo Structure

```
eduai365/
├── apps/
│   ├── api-gateway/        # NestJS API (port 4000)
│   ├── web-landing/        # Marketing site (port 3000)
│   ├── web-admin/          # Super Admin portal (port 3001)
│   ├── web-school/         # School Admin portal (port 3002)
│   ├── web-teacher/        # Teacher portal (port 3003)
│   ├── web-student/        # Student portal (port 3004)
│   ├── web-parent/         # Parent portal (port 3005)
│   └── e2e/                # Playwright E2E tests
├── packages/ui/            # Design system + Storybook
├── packages/i18n/          # English + Assamese message catalogs
├── packages/database/      # Prisma schema, migrations, seed
├── packages/rbac/          # Role-permission matrix
├── packages/shared-types/  # Shared TypeScript types
├── packages/shared-utils/  # Shared utilities
├── services/               # Microservices (future)
├── infrastructure/         # Docker, K8s, Terraform
└── docs/                   # Requirements, mockups, phase guides
```

## Phase Documentation

| Phase | Doc |
|-------|-----|
| 2–7 | [PHASE2.md](docs/PHASE2.md) … [PHASE7.md](docs/PHASE7.md) |
| 8–15 | [PHASE8.md](docs/PHASE8.md) … [PHASE15.md](docs/PHASE15.md) |
| 16 | [PHASE16.md](docs/PHASE16.md) — launch checklist, E2E, CI/CD |
