import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  hasPermission,
  effectivePermissions,
  type SessionPayload,
} from "@/lib/session";
import type { Permission } from "@/lib/constants";

export * from "@/lib/session";

/**
 * Resolves the session from the JWT, then re-reads role/permissions/status
 * from the database rather than trusting the (up to 7-day-old) JWT payload.
 * This is what makes a suspend/disable/delete or a permission change take
 * effect on the user's very next request instead of only their next login.
 * Returns null for a missing/invalid token, a deleted user, or a user
 * whose status is no longer "active" — callers treat all three as "no
 * session" (requireSession() below throws unauthorized for all of them).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySession(token);
  if (!payload) return null;

  const { connectDB } = await import("@/lib/db");
  const { User } = await import("@/models/User");
  await connectDB();
  const user = await User.findById(payload.sub).select("role permissions status deletedAt").lean();
  if (!user || user.deletedAt || (user.status && user.status !== "active")) return null;

  return {
    sub: payload.sub,
    role: user.role,
    permissions: effectivePermissions(user.role, user.permissions ?? []),
  };
}

export async function setSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    const { Errors } = await import("@/lib/api");
    throw Errors.unauthorized();
  }
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionPayload> {
  const session = await requireSession();
  if (!hasPermission(session, permission)) {
    const { Errors } = await import("@/lib/api");
    throw Errors.forbidden();
  }
  return session;
}
