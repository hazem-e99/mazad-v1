import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

const TEST_PORT = 4300;
export const BASE_URL = `http://localhost:${TEST_PORT}`;

let serverProcess: ChildProcess | null = null;

async function waitForHealth(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Test server did not become healthy within ${timeoutMs}ms`);
}

/**
 * Starts the real custom server (Next + Socket.IO) on a dedicated test port,
 * in production mode. Next's dev mode maintains a filesystem lock
 * (.next/dev/lock) keyed to the project directory that refuses a second
 * concurrent `next dev`-based process regardless of port — which would
 * break this test run whenever a developer also has `npm run dev` open, or
 * whenever a prior interrupted test run left the lock behind. Production
 * mode has no such lock, so the caller must run `npm run build` first.
 */
export async function startTestServer(): Promise<void> {
  const repoRoot = path.resolve(__dirname, "..", "..");

  serverProcess = spawn(
    process.execPath,
    [path.join("node_modules", "tsx", "dist", "cli.mjs"), "--env-file=.env", "server/index.ts"],
    {
      cwd: repoRoot,
      env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: "production" },
      stdio: "pipe",
    }
  );

  serverProcess.stderr?.on("data", (chunk) => {
    // Surface real startup failures without spamming successful runs.
    const text = chunk.toString();
    if (text.includes("Error") || text.includes("EADDRINUSE")) console.error("[test server]", text);
  });

  await waitForHealth(30_000);
}

export async function stopTestServer(): Promise<void> {
  if (!serverProcess) return;
  const proc = serverProcess;
  serverProcess = null;

  await new Promise<void>((resolve) => {
    proc.once("exit", () => resolve());
    proc.kill();
    setTimeout(() => {
      proc.kill("SIGKILL");
      resolve();
    }, 5000).unref();
  });
}

/** Extracts the session cookie from a login/register response for reuse in subsequent requests. */
export function extractSessionCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No Set-Cookie header in response");
  return setCookie.split(";")[0];
}
