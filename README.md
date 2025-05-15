# Jubilee

Jubilee is a B2B SaaS dropshipping platform built for Shopify store owners. Sellers
connect their Shopify store, browse products from vetted suppliers, import them into
their storefront, and let Jubilee handle supplier-side fulfillment, branded packaging,
invoicing, and AI-assisted marketing assets.

This repository contains both halves of the v2 rewrite:

- **`jubilee-v2-api`** — Python / Django REST API (the backend)
- **`jubilee-v2-front`** — React / TypeScript single-page app (the frontend)

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment configuration](#environment-configuration)
- [Common development tasks](#common-development-tasks)
- [Key backend modules](#key-backend-modules)
- [Key frontend areas](#key-frontend-areas)
- [Integrations](#integrations)
- [Conventions](#conventions)

---

## Architecture

```
                ┌──────────────────────────────┐
                │  Shopify storefront / admin  │
                └─────────────┬────────────────┘
                              │  OAuth · Webhooks · Admin API
                              ▼
┌────────────────────┐   HTTPS / JWT    ┌────────────────────────────┐
│  React SPA         │ ───────────────▶ │  Django REST API           │
│  (Vite, TS)        │ ◀─────────────── │  (DRF · Channels · Celery) │
│  jubilee-v2-front  │   WebSocket      │  jubilee-v2-api            │
└────────────────────┘                  └──────────┬─────────────────┘
                                                   │
                  ┌──────────────────┬─────────────┼─────────────┬──────────────────┐
                  ▼                  ▼             ▼             ▼                  ▼
            ┌──────────┐       ┌─────────┐  ┌────────────┐ ┌──────────┐    ┌──────────────┐
            │ Postgres │       │  Redis  │  │   Celery   │ │   AWS    │    │  AI / 3rd    │
            │          │       │ + SQS   │  │  workers   │ │   S3     │    │  party APIs  │
            └──────────┘       └─────────┘  └────────────┘ └──────────┘    └──────────────┘
```

The frontend authenticates against the API with short-lived JWTs (refresh handled by
an Axios interceptor). The API persists state to Postgres, caches and brokers
messages through Redis, off-loads slow work (emails, image generation, webhook
fan-out) to Celery, stores user media in S3, and proxies AI generation through a
provider-agnostic layer (OpenAI, Anthropic, ElevenLabs, Pinecone).

## Tech stack

| Layer            | Backend (`jubilee-v2-api`)                              | Frontend (`jubilee-v2-front`)                       |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------- |
| Language         | Python 3                                                | TypeScript                                          |
| Framework        | Django 4.2 · Django REST Framework                      | React 18                                            |
| Build / dev      | `manage.py` · Gunicorn · Daphne (ASGI)                  | Vite                                                |
| Real-time        | Django Channels (WebSockets)                            | Native `WebSocket` + custom `useDropshippingSocket` |
| Async work       | Celery (Redis broker, AWS SQS image queue) · Beat       | TanStack Query for server state                     |
| State / routing  | —                                                       | React Router v6 · React Context                     |
| Persistence      | PostgreSQL 15                                           | `localStorage` (auth) · React Query cache           |
| Object storage   | AWS S3                                                  | —                                                   |
| Payments         | Stripe · PayPal · Shopify Billing API                   | Stripe.js / Elements                                |
| Auth             | JWT (SimpleJWT) · social login · WebAuthn passkeys      | JWT bearer with refresh interceptor                 |
| Email            | SendGrid · Customer.io                                  | —                                                   |
| AI providers     | OpenAI · Anthropic · ElevenLabs · Pinecone (embeddings) | —                                                   |
| Observability    | Datadog (logs, traces) · Flower                         | Datadog RUM · Google Analytics 4 · GTM              |
| Styling / UI     | —                                                       | Styled Components · React Toastify · TinyMCE        |
| i18n             | —                                                       | i18next · Crowdin                                   |
| Package manager  | pip                                                     | pnpm                                                |
| Container        | Docker · docker-compose                                 | (deployed as static build)                          |

## Repository layout

```
jubilee/
├── jubilee-v2-api/          # Django backend
│   ├── core/                # Project settings, URLs, Celery, middleware, health check
│   ├── authentication/      # Users, shops, JWT, social login, passkeys
│   ├── shopify_integration/ # Shopify OAuth and product/order sync
│   ├── dropshipping/        # Suppliers, products, variants, orders, sub-orders
│   ├── billing/             # Subscriptions, plans, Stripe / PayPal / Shopify Billing
│   ├── notifications/       # In-app notifications
│   ├── webhooks/            # Inbound webhook handlers (Shopify, Stripe)
│   ├── file/                # S3 / local storage backends for media
│   ├── ai/                  # Model providers, generation service, embeddings
│   ├── templates/           # Shared admin / email templates
│   ├── scripts/             # Helper shell scripts
│   ├── manage.py
│   ├── requirements.txt
│   ├── docker-compose.yml
│   └── Dockerfile
│
└── jubilee-v2-front/        # React frontend
    ├── public/
    └── src/
        ├── api/             # Axios client + per-domain queries / requests / types
        ├── pages/           # Route-level screens (login, dashboard, orders, …)
        ├── components/      # Reusable UI (layout, modals, filters, payment elements)
        ├── router/          # Route table, path constants, redirects
        ├── contexts/        # Account, Store, React Query providers
        ├── hooks/           # useAccount, useForm, useDropshippingSocket, …
        ├── helpers/         # Auth, analytics, formatting, error handling
        ├── constants/       # Theme, paths, feature flags, terms
        ├── types/           # Shared TypeScript interfaces
        ├── translations/    # i18next bundles
        └── assets/          # Images, SVG, Lottie animations
```

## Quick start

### Prerequisites

- Docker & Docker Compose
- Python 3 + `pyenv` (recommended)
- Node 20 (`.nvmrc` is pinned)
- `pnpm` (`corepack enable && corepack prepare pnpm@latest --activate`)
- A Shopify Partner account if you want to exercise the OAuth flow end-to-end

### 1. Clone and configure

```sh
git clone <repo-url> jubilee
cd jubilee
cp jubilee-v2-api/.env.example jubilee-v2-api/.env
cp jubilee-v2-front/.env.example jubilee-v2-front/.env
```

Fill in the required values in both `.env` files — see [Environment
configuration](#environment-configuration) below for the most important keys.

### 2. Start the backend

```sh
cd jubilee-v2-api
docker-compose up -d                # Postgres + Redis + Celery + Flower
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt --use-deprecated=legacy-resolver
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver          # http://localhost:8000
```

API docs (when `DEBUG=True`) live at `/swagger/` and `/redoc/`. Admin is at `/admin/`.

For deeper backend details (custom management commands such as `reset_webhooks`,
deployment notes), see [`jubilee-v2-api/README.md`](jubilee-v2-api/README.md).

### 3. Start the frontend

```sh
cd jubilee-v2-front
pnpm install
pnpm dev                            # http://localhost:8100
```

Build a production bundle with `pnpm build` and preview it with `pnpm preview`. See
[`jubilee-v2-front/README.md`](jubilee-v2-front/README.md) for the GitHub Actions
environment setup used in CI/CD.

## Environment configuration

Both apps ship `.env.example` files that document every variable; copy them to
`.env` and fill in values. The settings you almost always need locally:

**Backend (`jubilee-v2-api/.env`)**

- `SECRET_KEY`, `DEBUG`
- `DATABASE_URL` (defaults to the docker-compose Postgres on port 5448)
- `REDIS_URL` (defaults to the docker-compose Redis on port 6394)
- `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` (only what you use)
- `SENDGRID_API_KEY`

**Frontend (`jubilee-v2-front/.env`)**

- `VITE_API_URL` — base URL of the backend (e.g. `http://localhost:8000`)
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_GA_MEASUREMENT_ID`, `VITE_INTERCOM_KEY` (optional)

Never commit a real `.env` — both projects' `.gitignore` rules already exclude it.

## Common development tasks

| Task                              | Command                                                     | Where                |
| --------------------------------- | ----------------------------------------------------------- | -------------------- |
| Run Django migrations             | `python manage.py migrate`                                  | `jubilee-v2-api`     |
| Make new migration                | `python manage.py makemigrations <app>`                     | `jubilee-v2-api`     |
| Start Celery worker (default)     | `./start-worker.sh`                                         | `jubilee-v2-api`     |
| Start image-generation worker     | `./start-worker-images.sh`                                  | `jubilee-v2-api`     |
| Start Celery beat (scheduler)     | `./start-beat.sh`                                           | `jubilee-v2-api`     |
| Flower task monitor               | open `http://localhost:5571`                                | `jubilee-v2-api`     |
| Reset Shopify webhooks for a user | `python manage.py reset_webhooks`                           | `jubilee-v2-api`     |
| Run frontend dev server           | `pnpm dev`                                                  | `jubilee-v2-front`   |
| Production frontend build         | `pnpm build`                                                | `jubilee-v2-front`   |
| Lint                              | `pnpm lint`                                                 | `jubilee-v2-front`   |

## Key backend modules

- **`core/`** — Django settings, ASGI/WSGI entry, Celery app, custom middlewares
  (current-user injection, admin 2FA), health check, shared decorators.
- **`authentication/`** — `CustomUser` and `Shop` models, JWT login/refresh, social
  login adapters, WebAuthn passkeys, signup tracking via PartnerStack and GA.
- **`shopify_integration/`** — Shopify OAuth handshake (`/shopify_login`,
  `/shopify_token`), product/order sync, webhook reset CLI.
- **`dropshipping/`** — supplier / product / variant / order models, REST endpoints,
  branded image generation, Celery tasks, WebSocket consumers for live order updates.
- **`billing/`** — subscription plans, Stripe / PayPal / Shopify Billing providers,
  webhook handlers, MRR metrics and subscription history.
- **`notifications/`** — in-app notification records and feeds.
- **`webhooks/`** — single entry point for inbound webhooks; routes to per-provider
  handlers.
- **`file/`** — S3 and local storage backends, upload endpoints.
- **`ai/`** — provider abstraction (`providers/`), service manager
  (`services/ai_manager.py`), Pinecone repository for embeddings, generation cost
  tracking on the `Generation` model.

## Key frontend areas

- **`pages/login`, `register`, `forgot-password`** — auth flow including social
  providers.
- **`pages/store-login`** — Shopify OAuth entry; redirects to the backend.
- **`pages/dashboard`, `home`** — landing screens with KPIs and overview widgets.
- **`pages/import-list`** — browse supplier catalogue and push products to Shopify.
- **`pages/live-products`** — manage products already published to the connected
  store.
- **`pages/orders`** — order management with tracking, customer details, and bulk
  checkout summary.
- **`pages/checkout`** — Stripe payment elements and plan selection.
- **`pages/customization`, `branding`** — invoice templates, packaging, branded
  assets.
- **`pages/winning-ads`** — curated marketing assets and tutorials.
- **`pages/settings`, `cancel`** — account, subscription management, cancellation
  and upgrade funnel.

## Integrations

- **Shopify** — OAuth, Admin API, webhooks (orders, products, app/uninstall)
- **Stripe** — checkout, payment methods, customer portal, webhooks
- **PayPal** — alternative subscription provider
- **AWS S3** — user media, branded invoice PDFs
- **SendGrid** — transactional email
- **Customer.io** — lifecycle email
- **Intercom** — in-app support chat
- **Datadog** — backend traces / logs and frontend RUM
- **Google Analytics 4 + GTM** — product analytics
- **PartnerStack** — partner / affiliate attribution
- **OpenAI, Anthropic, ElevenLabs, Pinecone** — AI generation and embeddings

## Conventions

- **Commits** — Conventional Commits (`feat(scope): …`, `chore(scope): …`,
  `fix(scope): …`, `docs(scope): …`). Imperative mood, kept under ~72 characters.
- **Branching** — short-lived feature branches off `main`; PRs reviewed before
  merge.
- **Frontend code style** — ESLint + Prettier; both run on staged files.
- **Backend code style** — follow the existing module layout (`models.py`,
  `views.py`, `serializers.py`, `tasks.py`, `signals.py`, `webhooks.py`) when adding
  features.
- **Secrets** — never commit `.env` files or credentials. Use GitHub Actions
  environments for CI/CD secrets (see the frontend README for the full list).
