import { connectDB } from "@/lib/db";
import { PageVisit } from "@/models/PageVisit";
import { dayKeyFormatter } from "@/lib/adminQueries";

/**
 * Records one visitor for today, defined as one row per
 * (anonymous visitor cookie, calendar day). Idempotent: a second call for
 * the same visitor/day hits the unique index and is treated as "already
 * counted" rather than an error — the exact idiom purchaseDirect() already
 * uses for Purchase's unique index.
 */
export async function recordVisit(params: { visitorId: string; userId?: string | null }): Promise<{ recorded: boolean }> {
  await connectDB();
  const date = dayKeyFormatter.format(new Date());

  try {
    await PageVisit.create({ visitorId: params.visitorId, date, userId: params.userId ?? null });
    return { recorded: true };
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: number }).code === 11000) {
      return { recorded: false };
    }
    throw err;
  }
}
