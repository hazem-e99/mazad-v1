/**
 * Repairs the `users` collection's indexes so they match the schema in
 * src/models/User.ts — in particular the partial unique index on `email`,
 * which is only meant to enforce uniqueness among non-deleted users that
 * actually have an email string (see the partialFilterExpression there).
 *
 * A plain `unique: true` email_1 index from an earlier revision of the
 * schema does not get replaced by mongoose's autoIndex on its own —
 * creating an index whose name already exists with different options is
 * silently skipped, not upgraded. That stale index enforces uniqueness on
 * *every* value including `null`, so saving a second user with no email
 * fails with `E11000 duplicate key error ... dup key: { email: null }`
 * even though the current schema explicitly excludes null/non-string
 * emails from uniqueness.
 *
 * Safe to re-run: syncIndexes() only touches indexes that don't already
 * match the schema.
 *
 * Run with: npm run repair:user-indexes
 * (equivalent to: npx tsx --env-file=.env server/repairUserIndexes.ts)
 */
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function runUserIndexRepair() {
  const dropped = await User.syncIndexes();
  const current = await User.collection.indexes();
  return { dropped, current };
}

async function main() {
  await connectDB();
  console.log("Syncing users collection indexes with the current schema...");

  const { dropped, current } = await runUserIndexRepair();

  if (dropped.length === 0) {
    console.log("Indexes already matched the schema — nothing to do.");
  } else {
    console.log(`Dropped and recreated ${dropped.length} stale index(es):`, dropped);
  }

  console.log(
    "Current indexes:",
    current.map((i) => ({ name: i.name, key: i.key, partialFilterExpression: i.partialFilterExpression }))
  );

  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("User index repair failed:", err);
    process.exit(1);
  });
}
