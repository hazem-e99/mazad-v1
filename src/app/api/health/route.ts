import mongoose from "mongoose";
import { NextResponse } from "next/server";

/**
 * Liveness probe for process managers / Render.
 * Database connectivity is reported but does not make the service unhealthy.
 */
export async function GET() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"] as const;
  const dbState = mongoose.connection.readyState;

  return NextResponse.json(
    {
      status: "ok",
      database: states[dbState] ?? "unknown",
      uptime: Math.round(process.uptime()),
    },
    { status: 200 }
  );
}
