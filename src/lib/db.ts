import mongoose from "mongoose";
import dns from "node:dns";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

declare global {
  var __mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.__mongooseConn ?? { conn: null, promise: null };
global.__mongooseConn = cached;

async function connectWithFallbackDns(uri: string) {
  try {
    return await mongoose.connect(uri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isSrvDnsFailure =
      uri.startsWith("mongodb+srv://") &&
      (message.includes("querySrv") || message.includes("ENOTFOUND") || message.includes("ECONNREFUSED"));

    if (!isSrvDnsFailure) throw err;

    // Some local/dev network setups point Node's resolver at a loopback DNS
    // proxy that cannot answer SRV/TXT queries required by mongodb+srv://.
    // Retry once against public resolvers before giving up.
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    return await mongoose.connect(uri);
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connectWithFallbackDns(MONGODB_URI as string).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
