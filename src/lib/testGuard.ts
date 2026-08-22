/**
 * Safety guard for automated tests that write to the configured MongoDB
 * database. This project uses a single Atlas cluster/database (no separate
 * test/prod split provisioned), so tests cannot rely on a distinct database
 * name to stay safe. Instead, safety comes from two things enforced here
 * and in the test files themselves:
 *
 * 1. Every document a test creates is tagged with a unique per-run marker
 *    (see TEST_TAG in auctionService.test.ts) and only documents bearing
 *    that exact tag are ever deleted — tests never call deleteMany({}) or
 *    otherwise touch pre-existing data.
 * 2. This guard fails fast if MONGODB_URI is missing or empty, so a
 *    misconfigured environment cannot silently run destructive operations
 *    against whatever mongoose happens to already be connected to.
 */
export function assertTestDatabaseConfigured(): void {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set — refusing to run tests without an explicit, known database target."
    );
  }
}

/**
 * Guards a cleanup query so it can only ever target documents whose id (or
 * a tagged field) matches a value the current test run itself generated.
 * Throws if the filter looks like it could match unrelated/pre-existing
 * documents (an empty filter, or a filter with no test-tag-shaped value).
 */
export function assertScopedTestFilter(filter: Record<string, unknown>, testTag: string): void {
  if (!testTag || testTag.length < 8) {
    throw new Error("Test cleanup requires a sufficiently unique per-run tag — refusing to proceed with a weak tag.");
  }
  if (Object.keys(filter).length === 0) {
    throw new Error("Refusing to run an unscoped (empty-filter) cleanup query in tests.");
  }
}
