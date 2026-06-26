# WORK

Futuristic professional network — jobs, communities, AI assistant, social feed, real-time messaging, CV builder.

## Stack

- **Web**: Next.js 15 (App Router), TS, Tailwind, shadcn-style UI, Framer Motion, GSAP, R3F, Lenis, Zustand, TanStack Query
- **API**: Node, Express, MongoDB (Mongoose), Redis, Socket.io
- **Auth**: JWT (access 15m + refresh 7d in httpOnly cookie), Google + GitHub OAuth, RBAC
- **Media**: Cloudinary
- **Infra**: Turborepo monorepo, Docker for Mongo/Redis, deploy on Vercel (web) + Fly/Railway (api)

## Layout

```
work/
├─ apps/
│  ├─ web/       Next.js app
│  └─ api/       Express + Socket.io
├─ packages/
│  └─ types/     Shared TS types (@work/types)
├─ docker-compose.yml
├─ turbo.json
└─ npm-workspace.yaml
```

## Setup

```bash
cp .env.example .env
docker compose up -d mongo redis
npm install
npm run dev
```

Web: http://localhost:3000  ·  API: http://localhost:4000

Seed demo data: `npm run seed` → log in with **demo@work.app / password123**.

### ⚠️ Windows + OneDrive

OneDrive corrupts `node_modules` / `.next` (it virtualizes build files into truncated placeholders → broken installs and black screens). If this project lives under OneDrive:

- `node_modules` is kept **outside** OneDrive via directory junctions (`node_modules → C:\work-modules\…`). If you ever delete `node_modules`, recreate the junctions before `npm install`, e.g.:
  ```cmd
  mklink /J node_modules C:\work-modules\root
  ```
- `predev` clears `.next` before each `npm run dev` (avoids stale/corrupt cache).
- Best long-term fix: move the repo out of OneDrive (e.g. `C:\dev\work`).

## Scripts

- `npm run dev` — run web + api in parallel
- `npm run build` — build all (production)
- `npm run typecheck` — typecheck all
- `npm run test` — run unit tests (Vitest, web + api)
- `npm run seed` / `npm run seed:reset` — populate demo data

## API surface

See `apps/api/src/routes.ts` + module routers. Versioned under `/api/v1`.

## Sockets

JWT-authenticated WS. Namespaces handled via rooms:
- `user:{id}` — personal notifications
- `room:{id}` — chat
- presence broadcast

## Deployment

- Web → Vercel (Fluid Compute, ISR for marketing pages)
- API → Fly.io / Railway / Render with Redis adapter for horizontal scale
- Mongo → Atlas (Vector Search for job matching)
- Redis → Upstash
- Media → Cloudinary signed uploads
