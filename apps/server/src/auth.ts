import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import nodemailer from "nodemailer";
import type { Request, Response } from "express";
import { Store, type AccountRecord } from "./store.js";

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const newId = () => randomBytes(18).toString("hex");
const cookieName = "stackline_session";
const verificationLifetimeMs = 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(private readonly store: Store, private readonly appUrl: string, private readonly isProduction: boolean, private readonly sessionSecret: string) {}

  async hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); const derived = await scrypt(password, salt, 64) as Buffer; return `${salt}:${derived.toString("hex")}`; }
  async passwordMatches(password: string, stored: string) { const [salt, expected] = stored.split(":"); if (!salt || !expected) return false; const actual = await scrypt(password, salt, 64) as Buffer; return timingSafeEqual(actual, Buffer.from(expected, "hex")); }
  async register(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = this.store.findAccountByEmail(normalizedEmail);
    if (existing) { if (existing.emailVerified) throw new Error("An account with that email already exists."); await this.issueVerification(existing); return; }
    const account: AccountRecord = { id: newId(), email: normalizedEmail, passwordHash: await this.hashPassword(password), emailVerified: false, createdAt: new Date().toISOString() };
    await this.store.createAccount(account);
    await this.issueVerification(account);
  }
  async resendVerification(email: string) {
    const account = this.store.findAccountByEmail(email.trim().toLowerCase());
    if (!account || account.emailVerified) return;
    await this.issueVerification(account);
  }
  async verify(token: string) {
    const account = this.store.findAccountByVerificationToken(hashToken(token));
    if (!account || !account.verificationExpiresAt || new Date(account.verificationExpiresAt) < new Date()) throw new Error("This verification link is invalid or has expired. Request a new one from the login form.");
    account.emailVerified = true; delete account.verificationTokenHash; delete account.verificationExpiresAt; await this.store.updateAccount(account);
  }
  async login(email: string, password: string, response: Response) {
    const account = this.store.findAccountByEmail(email.trim().toLowerCase());
    if (!account || !(await this.passwordMatches(password, account.passwordHash))) throw new Error("Invalid email or password.");
    if (!account.emailVerified) throw new Error("Confirm your email before signing in. You can resend the verification email below.");
    const token = randomBytes(32).toString("base64url");
    await this.store.createSession({ id: newId(), userId: account.id, tokenHash: this.hashSessionToken(token), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), createdAt: new Date().toISOString() });
    response.cookie(cookieName, token, { httpOnly: true, sameSite: "lax", secure: this.isProduction, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" }); return account;
  }
  async logout(request: Request, response: Response) { const token = this.readToken(request); if (token) await this.store.deleteSession(this.hashSessionToken(token)); response.clearCookie(cookieName, { httpOnly: true, sameSite: "lax", secure: this.isProduction, path: "/" }); }
  userFromRequest(request: Request) { const token = this.readToken(request); const session = token && this.store.findSession(this.hashSessionToken(token)); return session ? this.store.findAccountById(session.userId) : undefined; }
  private async issueVerification(account: AccountRecord) {
    const token = randomBytes(32).toString("base64url"); account.verificationTokenHash = hashToken(token); account.verificationExpiresAt = new Date(Date.now() + verificationLifetimeMs).toISOString(); await this.store.updateAccount(account);
    const verificationUrl = `${this.appUrl.replace(/\/$/, "")}/verify-email?token=${encodeURIComponent(token)}`;
    await this.sendVerificationEmail(account.email, verificationUrl);
  }
  private readToken(request: Request) { return request.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1); }
  private hashSessionToken(token: string) { return createHmac("sha256", this.sessionSecret).update(token).digest("hex"); }
  private async sendVerificationEmail(email: string, verificationUrl: string) {
    const host = process.env.SMTP_HOST; const user = process.env.SMTP_USER; const password = process.env.SMTP_PASSWORD; const from = process.env.SMTP_FROM;
    if (!host || !user || !password || !from) throw new Error("Email delivery is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.");
    try {
      const transporter = nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT ?? 465), secure: process.env.SMTP_SECURE === "true", auth: { user, pass: password } });
      const result = await transporter.sendMail({ from, to: email, subject: "Confirm your Stackline Poker account", text: `Confirm your Stackline Poker account by opening this link: ${verificationUrl}`, html: `<p>Confirm your Stackline Poker account.</p><p><a href="${verificationUrl}">Confirm email address</a></p><p>This link expires in 24 hours.</p>` });
      if (!result.accepted.includes(email) || result.rejected.length) throw new Error(`SMTP rejected recipient(s): ${result.rejected.join(", ") || email}`);
      console.info(`Verification email accepted by SMTP for ${email}; message ID: ${result.messageId}`);
    } catch (error) { console.error(`Failed to send verification email to ${email}:`, error); throw new Error("We could not send the verification email. Check SMTP configuration and try again."); }
  }
}
