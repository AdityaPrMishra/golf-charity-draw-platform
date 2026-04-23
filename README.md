# Golf Charity Draw Platform (Monorepo)

This repo is structured so **frontend** and **backend** can be **deployed separately** (e.g. as two Vercel projects), while still sharing code through `packages/`.

## Structure

- `apps/web`: Next.js (App Router) frontend (`vercel.json` sets monorepo install for `@golf/lib`)
- `apps/api`: Next.js (App Router) backend (API routes, webhooks; same install pattern)
- `packages/lib`: shared TypeScript utilities (workspace dependency of both apps)
- `supabase`: SQL reference for your Supabase project (run in the Supabase SQL editor or CLI against prod)

## Local development

From repo root:

```bash
npm install
npm run dev:web
```

In a second terminal:

```bash
npm run dev:api
```

## Environment variables

- `apps/web/.env.example` → copy to `apps/web/.env.local`
- `apps/api/.env.example` → copy to `apps/api/.env.local`

## Deployment (separate)

Create **two** Vercel projects:

- **Frontend** project root: `apps/web`
- **Backend** project root: `apps/api`

Each app includes `vercel.json` with `installCommand` that runs `npm ci` from the **repository root** with `-w web` or `-w api`, so the workspace package `@golf/lib` resolves the same way as locally.

Set environment variables separately in each project (never commit real secrets). Use `apps/web/.env.example` and `apps/api/.env.example` as checklists.

### Checklist

1. **Supabase (prod):** Create the project, then apply the SQL under `supabase/` in a sensible order (start with `schema.sql`, then any additive scripts you rely on).
2. **Web project:** `NEXT_PUBLIC_*` values from Supabase and Stripe; `NEXT_PUBLIC_API_URL` must be the **deployed API** base URL (no trailing slash).
3. **API project:** Service role key, Stripe secrets + **price IDs**, Resend + `EMAIL_FROM` (verified domain in production). Set `NEXT_PUBLIC_APP_URL` to the **deployed web** URL. Set `API_ALLOWED_ORIGIN` to that same web origin for browser calls from the app.
4. **Stripe:** Webhook endpoint `https://<your-api-domain>/api/stripe/webhook` using the signing secret from the Stripe dashboard into `STRIPE_WEBHOOK_SECRET` on the API project.
5. **Smoke test:** Open the web `/pricing` flow, confirm webhook updates `profiles` / `subscriptions`, and hit `/api/health` on the API deployment.

