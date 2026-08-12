# Architecture

`apps/web` is the Next.js user interface. `apps/server` owns Socket.IO connections and game orchestration. `packages/poker-engine` is a pure deterministic rules package, deliberately isolated from React and transport concerns. `packages/shared` contains transport-safe contracts.

The server authenticates every socket, authorizes each action, creates decks with server-side cryptographic randomness, stores chip movements in a ledger, and only broadcasts a player's own hole cards plus public state.
