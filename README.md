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

## Scripts

- `npm run dev` — run web + api in parallel
- `npm run build` — build all
- `npm run typecheck` — typecheck all

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
