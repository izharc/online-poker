import cors from "cors";
import { existsSync, readFileSync } from "node:fs";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { AuthService } from "./auth.js";
import { PracticeTable } from "./game.js";
import { Store } from "./store.js";

if (existsSync(".env.local")) for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) { const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, ""); }

const port = Number(process.env.PORT ?? 4000);
const origin = process.env.WEB_ORIGIN?.split(",") ?? "http://localhost:3000";
const store = Store.open(process.env.DATABASE_URL);
const isProduction = process.env.NODE_ENV === "production";
if (isProduction && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is required in production.");
const auth = new AuthService(store, process.env.APP_URL ?? "http://localhost:3000", isProduction, process.env.SESSION_SECRET ?? "local-development-only-secret");
const table = new PracticeTable();
const app = express();
app.use(cors({ origin, credentials: true })); app.use(express.json());
app.get("/health", (_request, response) => response.json({ status: "ok" }));
const credentials = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });
app.post("/auth/register", async (request, response) => { const input = credentials.safeParse(request.body); if (!input.success) return response.status(400).json({ error: "Use a valid email and an 8+ character password." }); try { await auth.register(input.data.email, input.data.password); response.status(201).json({ message: "Check your email to confirm your account." }); } catch (error) { response.status(409).json({ error: error instanceof Error ? error.message : "Could not create account." }); } });
app.post("/auth/resend-verification", async (request, response) => { const email = z.string().email().safeParse(request.body?.email); if (!email.success) return response.status(400).json({ error: "Enter the email address for your account." }); try { await auth.resendVerification(email.data); response.json({ message: "If that account still needs confirmation, a verification email has been sent." }); } catch (error) { response.status(502).json({ error: error instanceof Error ? error.message : "Could not send verification email." }); } });
app.post("/auth/verify", async (request, response) => { const token = z.string().min(1).safeParse(request.body?.token); if (!token.success) return response.status(400).json({ error: "Missing verification token." }); try { await auth.verify(token.data); response.json({ message: "Email confirmed. You can now sign in." }); } catch (error) { response.status(400).json({ error: error instanceof Error ? error.message : "Verification failed." }); } });
app.post("/auth/login", async (request, response) => { const input = credentials.safeParse(request.body); if (!input.success) return response.status(400).json({ error: "Invalid email or password." }); try { const account = await auth.login(input.data.email, input.data.password, response); response.json({ user: { id: account.id, email: account.email } }); } catch (error) { response.status(401).json({ error: error instanceof Error ? error.message : "Could not sign in." }); } });
app.post("/auth/logout", async (request, response) => { await auth.logout(request, response); response.status(204).end(); });
app.get("/auth/me", (request, response) => { const account = auth.userFromRequest(request); if (!account) return response.status(401).json({ error: "Not signed in." }); response.json({ user: { id: account.id, email: account.email } }); });

const httpServer = createServer(app); const io = new Server(httpServer, { cors: { origin, credentials: true } });
io.use((socket, next) => { const account = auth.userFromRequest({ headers: { cookie: socket.handshake.headers.cookie } } as express.Request); if (!account) return next(new Error("Authentication required")); socket.data.account = account; next(); });
io.on("connection", socket => { const account = socket.data.account as { id: string; email: string }; socket.on("table:join", (acknowledge) => acknowledge({ ok: true, state: table.join(account.id, account.email) })); socket.on("player:action", (input, acknowledge) => { const parsed = z.object({ type: z.enum(["FOLD", "CHECK", "CALL", "BET", "RAISE"]), amount: z.number().int().positive().optional() }).safeParse(input); if (!parsed.success) return acknowledge({ ok: false, error: "Invalid action." }); try { acknowledge({ ok: true, state: table.act(account.id, parsed.data.type, parsed.data.amount) }); } catch (error) { acknowledge({ ok: false, error: error instanceof Error ? error.message : "Action failed." }); } }); });
httpServer.listen(port, () => console.log(`Poker server listening on ${port}`));
