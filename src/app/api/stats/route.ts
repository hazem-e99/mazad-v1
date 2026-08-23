import { getDashboardStats, getStatsTimeSeries } from "@/lib/adminQueries";
import { requirePermission } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

/**
 * The same numbers the /admin/stats page renders. That page is a server
 * component and calls the query layer directly (as every admin page in
 * this app does), so this route exists for clients that can't — and both
 * go through getDashboardStats/getStatsTimeSeries rather than each
 * writing its own counts, which is how the two drifted apart before.
 */
export async function GET() {
  try {
    await requirePermission("stats:view");

    const [totals, daily] = await Promise.all([getDashboardStats(), getStatsTimeSeries()]);

    return jsonOk({ ...totals, daily });
  } catch (err) {
    return handleApiError(err);
  }
}
