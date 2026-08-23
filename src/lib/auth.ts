import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSession,
  verifySession,
  hasPermission,
  type SessionPayload,
} from "@/lib/session";
import type { Permission } from "@/lib/constants";

export * from "@/lib/session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
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

/**
 * Page-level counterpart to requirePermission.
 *
 * An API route answers a missing permission with a 403 JSON body; a
 * server *page* has to answer with a page. Rather than Next's
 * `forbidden()` — which is still behind the experimental
 * `authInterrupts` flag — this reports the verdict and lets the caller
 * render the denial in place of the section's content, inside the
 * dashboard chrome.
 *
 * Every /admin section needs its own call. The admin layout only proves
 * the visitor is staff — it cannot know which of the two dozen screens
 * under it a given supervisor is entitled to, and without this a
 * supervisor could open the user manager, the audit log and the site
 * settings by typing the URL.
 *
 * Returns the session when allowed and `null` when not; an unauthenticated
 * visitor is redirected to sign in and never returns from this call.
 */
export async function checkPagePermission(permission: Permission): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return hasPermission(session, permission) ? session : null;
}

/** Whether a session holds *any* of the given permissions — used by the
 * sidebar, which hides a whole section when none of its links are open to
 * the viewer. */
export function hasAnyPermission(session: SessionPayload | null, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(session, permission));
}
