import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const SESSION_COOKIE = "rb_uid";

export function getSessionSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("SESSION_SECRET is required");
  return s;
}

export function setSessionCookie(res: Response, userId: string): void {
  res.cookie(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    signed: true,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function readSession(req: Request): string | null {
  const v = req.signedCookies?.[SESSION_COOKIE];
  if (typeof v !== "string" || v.length === 0) return null;
  return v;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const uid = readSession(req);
  if (!uid) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as Request & { userId: string }).userId = uid;
  next();
}

export function getUserId(req: Request): string {
  return (req as Request & { userId: string }).userId;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(computed, "hex"),
    );
  } catch {
    return false;
  }
}

export function genId(): string {
  return crypto.randomBytes(12).toString("hex");
}
