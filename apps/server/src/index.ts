import cors from "cors";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";

const port = Number(process.env.PORT ?? 4000);
const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(",") ?? "http://localhost:3000" }));
app.get("/health", (_request, response) => response.json({ status: "ok" }));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.WEB_ORIGIN?.split(",") ?? "http://localhost:3000" } });
const actionSchema = z.object({ tableId: z.string().uuid(), handId: z.string().uuid(), actionId: z.string().uuid(), type: z.enum(["FOLD", "CHECK", "CALL", "BET", "RAISE", "ALL_IN"]), amount: z.number().int().positive().optional() });

io.use((socket, next) => {
  // Phase 2: verify a Supabase access token and set socket.data.userId.
  if (!socket.handshake.auth.token) return next(new Error("Authentication required"));
  next();
});
io.on("connection", (socket) => {
  socket.on("player:action", (input, acknowledge) => {
    const parsed = actionSchema.safeParse(input);
    if (!parsed.success) return acknowledge({ ok: false, error: "Invalid action." });
    // Phase 6: load table state, assert player/turn/action legality, persist atomically, then broadcast a redacted state.
    acknowledge({ ok: false, error: "Tables are not available yet." });
  });
});
httpServer.listen(port, () => console.log(`Poker server listening on ${port}`));
