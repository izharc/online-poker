import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

export interface AccountRecord { id: string; email: string; passwordHash: string; emailVerified: boolean; verificationTokenHash?: string; verificationExpiresAt?: string; createdAt: string }
export interface SessionRecord { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string }
type AccountRow = { id: string; email: string; password_hash: string; email_verified: number; verification_token_hash: string | null; verification_expires_at: string | null; created_at: string };

export class Store {
  private constructor(private readonly db: DatabaseSync) {}
  static open(databaseUrl: string | undefined) {
    const configured = databaseUrl ?? "sqlite:./data/poker.db";
    const rawPath = configured.replace(/^sqlite:/, "");
    if (!configured.startsWith("sqlite:") && !configured.startsWith("./") && !configured.startsWith("/")) throw new Error("DATABASE_URL must point to a local SQLite database, for example sqlite:./data/poker.db.");
    const filePath = resolve(process.cwd(), rawPath || "./data/poker.db");
    mkdirSync(dirname(filePath), { recursive: true });
    const store = new Store(new DatabaseSync(filePath));
    store.db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0, verification_token_hash TEXT, verification_expires_at TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id));
      CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);`);
    return store;
  }
  private account(row: AccountRow | undefined): AccountRecord | undefined { return row && { id: row.id, email: row.email, passwordHash: row.password_hash, emailVerified: Boolean(row.email_verified), verificationTokenHash: row.verification_token_hash ?? undefined, verificationExpiresAt: row.verification_expires_at ?? undefined, createdAt: row.created_at }; }
  findAccountByEmail(email: string) { return this.account(this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as AccountRow | undefined); }
  findAccountById(id: string) { return this.account(this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as AccountRow | undefined); }
  findAccountByVerificationToken(hash: string) { return this.account(this.db.prepare("SELECT * FROM users WHERE verification_token_hash = ?").get(hash) as AccountRow | undefined); }
  async createAccount(account: AccountRecord) { this.db.prepare("INSERT INTO users (id,email,password_hash,email_verified,verification_token_hash,verification_expires_at,created_at) VALUES (?,?,?,?,?,?,?)").run(account.id, account.email, account.passwordHash, Number(account.emailVerified), account.verificationTokenHash ?? null, account.verificationExpiresAt ?? null, account.createdAt); }
  async updateAccount(account: AccountRecord) { this.db.prepare("UPDATE users SET email = ?, password_hash = ?, email_verified = ?, verification_token_hash = ?, verification_expires_at = ? WHERE id = ?").run(account.email, account.passwordHash, Number(account.emailVerified), account.verificationTokenHash ?? null, account.verificationExpiresAt ?? null, account.id); }
  findSession(tokenHash: string) { const row = this.db.prepare("SELECT id,user_id,token_hash,expires_at,created_at FROM sessions WHERE token_hash = ? AND expires_at > ?").get(tokenHash, new Date().toISOString()) as { id: string; user_id: string; token_hash: string; expires_at: string; created_at: string } | undefined; return row && { id: row.id, userId: row.user_id, tokenHash: row.token_hash, expiresAt: row.expires_at, createdAt: row.created_at }; }
  async createSession(session: SessionRecord) { this.db.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)").run(session.id, session.userId, session.tokenHash, session.expiresAt, session.createdAt); }
  async deleteSession(tokenHash: string) { this.db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash); }
}
