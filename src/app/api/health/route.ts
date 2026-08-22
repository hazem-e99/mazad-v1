import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Liveness + database-connectivity probe for process managers / Nginx.
 * Intentionally returns no infrastructure details beyond up/down status.
 */
export async function GET() {
  try {
    const mongoose = await connectDB();
    const dbState = mongoose.connection.readyState; // 1 = connected

    if (dbState !== 1) {
      return NextResponse.json({ status: "degraded", database: "disconnected" }, { status: 503 });
    }

    return NextResponse.json({ status: "ok", database: "connected" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
