# Online Poker

Play-money, multiplayer Texas Hold'em platform. The browser is a presentation layer; all game actions, cards, balances and payouts are validated by the backend.

## Status

Phase 1 is initialized: TypeScript workspace, Next.js web shell, Socket.IO server shell, shared types, poker engine foundation, environment template and CI.

## Local development

1. Copy `.env.example` to `.env.local`, set `SESSION_SECRET`, and configure SMTP to deliver verification messages. The server reads this file when started from the repository root.
2. `npm install`
3. `npm run dev:web` and, in another terminal, `npm run dev:server`

Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Deployment topology

Deploy `apps/web` to Vercel and `apps/server` to a persistent Node host such as Railway, Render or Fly.io. Authentication is owned by the server; do not deploy the Socket.IO process as a standard Vercel serverless function.
