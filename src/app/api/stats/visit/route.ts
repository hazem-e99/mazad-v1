import { cookies } from "next/headers";
import { getSession, isStaffSession } from "@/lib/auth";
import { recordVisit } from "@/services/visitService";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, handleApiError } from "@/lib/api";

const VISITOR_COOKIE = "mazad_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Not permission-gated — anyone (including anonymous visitors) can call
 * this, that's the point. Staff sessions are explicitly excluded so the
 * team's own browsing never inflates the count; belt-and-suspenders with
 * VisitorPing only being mounted in the public layout, never /admin.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (session && isStaffSession(session)) return jsonOk({ recorded: false });

    const store = await cookies();
    let visitorId = store.get(VISITOR_COOKIE)?.value;
    const isNew = !visitorId;
    if (!visitorId) visitorId = crypto.randomUUID();

    if (!rateLimit(`visit:${visitorId}`, 3, 10_000)) return jsonOk({ recorded: false });

    const { recorded } = await recordVisit({ visitorId, userId: session?.sub ?? null });
    const res = jsonOk({ recorded });
    if (isNew) {
      res.cookies.set(VISITOR_COOKIE, visitorId, {
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
        sameSite: "lax",
      });
    }
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
