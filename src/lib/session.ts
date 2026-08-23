import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Permission, UserRole } from "@/lib/constants";
import { ROLE_DEFAULT_PERMISSIONS } from "@/lib/constants";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET environment variable is not set");
  return secret;
}

export const SESSION_COOKIE = "mazad_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  permissions: Permission[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, getAuthSecret(), { expiresIn: SESSION_TTL_SECONDS });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getAuthSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function effectivePermissions(role: UserRole, granted: Permission[] = []): Permission[] {
  if (role === "admin") return ROLE_DEFAULT_PERMISSIONS.admin;
  return Array.from(new Set([...ROLE_DEFAULT_PERMISSIONS[role], ...granted]));
}

export function hasPermission(session: SessionPayload | null, permission: Permission): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return session.permissions.includes(permission);
}

/** Who the /admin dashboard lets in. Kept in one place so the post-login
 * redirect, the layout gates, and the realtime staff feed can never drift
 * apart — a session sent to /admin is always one /admin would admit. */
export function isStaffSession(session: SessionPayload | null | undefined): boolean {
  if (!session) return false;
  return (
    session.role === "admin" ||
    session.role === "supervisor" ||
    hasPermission(session, "stats:view")
  );
}
