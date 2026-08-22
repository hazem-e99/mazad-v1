import { readFileSync } from "node:fs";
import path from "node:path";

// Vitest doesn't auto-load .env like Next.js does; load it manually so
// MONGODB_URI/AUTH_SECRET are available to tests hitting the real Atlas DB.
try {
  const envPath = path.resolve(__dirname, ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // .env not present — assume env vars are already set (CI, etc).
}

// Fail fast if the database target isn't explicitly configured, before any
// test file runs and attempts a connection.
import { assertTestDatabaseConfigured } from "./src/lib/testGuard";
assertTestDatabaseConfigured();
