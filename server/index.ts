import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { verifySession, hasPermission, type SessionPayload } from "@/lib/session";
import { setIO, auctionRoom, ADMIN_AUCTION_ROOM, userRoom } from "@/lib/socket";
import { connectDB } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatModerationLog } from "@/models/ChatModerationLog";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit";
import { chatMessageSchema } from "@/lib/validation";
import { checkMessage } from "@/lib/chatModeration";

// Loaded lazily (not as a static top-level import) because this module
// transitively imports `next/server`. Statically importing it here — before
// Next's dev require-hook patches module loading via app.prepare() — leaves
// a pre-patch copy cached that later collides with Next's AsyncLocalStorage
// instrumentation once the scheduler tick actually exercises it.
type AuctionServiceModule = typeof import("@/services/auctionService");
let auctionServicePromise: Promise<AuctionServiceModule> | null = null;
function getAuctionService(): Promise<AuctionServiceModule> {
  if (!auctionServicePromise) auctionServicePromise = import("@/services/auctionService");
  return auctionServicePromise;
}

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

const app = next({ dev, webpack: true });
const handle = app.getRequestHandler();

async function warmPublicHome() {
  if (dev) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      signal: controller.signal,
      headers: { "user-agent": "mazad-render-warmup" },
    });
    console.log(`Public home warmup finished with ${res.status}`);
  } catch (err) {
    console.error("Public home warmup failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  await app.prepare();

  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: false },
  });

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie ?? "";
    const match = cookieHeader.match(/mazad_session=([^;]+)/);
    if (match) {
      const session = verifySession(decodeURIComponent(match[1]));
      if (session) socket.data.session = session;
    }
    next();
  });

  // Staff may watch the global auction feed; everyone else is limited to
  // the individual auction rooms. Mirrors the /admin layout's own gate so
  // the socket surface can't hand out data the pages wouldn't render.
  const isStaff = (session: SessionPayload | undefined) =>
    Boolean(
      session &&
        (session.role === "admin" ||
          session.role === "supervisor" ||
          hasPermission(session, "auction:manage") ||
          hasPermission(session, "stats:view"))
    );

  // Live viewer presence: Socket.IO's own adapter "join-room"/"leave-room"
  // events fire for every membership change *including* the automatic
  // leave a disconnect triggers — reusing that (rather than hand-rolling
  // counters across the auction:join/leave/disconnect handlers below) is
  // what makes this correct for tab close, navigation, network loss,
  // reconnect and duplicate connections for free, with nothing to leak or
  // drift, and nothing persisted to the database.
  //
  // Staff sockets join the room too (so the admin page can render this same
  // count), but are excluded from the tally itself — an admin watching a
  // live auction shouldn't inflate the number shown as "people watching".
  const AUCTION_ROOM_PREFIX = "auction:";
  function broadcastPresence(room: string) {
    if (!room.startsWith(AUCTION_ROOM_PREFIX)) return;
    const memberIds = io.sockets.adapter.rooms.get(room);
    let count = 0;
    if (memberIds) {
      for (const socketId of memberIds) {
        const memberSocket = io.sockets.sockets.get(socketId);
        if (memberSocket && !isStaff(memberSocket.data.session as SessionPayload | undefined)) count++;
      }
    }
    io.to(room).emit("auction:presence", { auctionId: room.slice(AUCTION_ROOM_PREFIX.length), count });
  }
  io.of("/").adapter.on("join-room", broadcastPresence);
  io.of("/").adapter.on("leave-room", broadcastPresence);

  io.on("connection", (socket) => {
    // Every authenticated connection auto-joins its own notification room
    // — unlike auction rooms, there's no per-page subscribe step, since a
    // user should receive their notifications no matter what page they're
    // on.
    const session = socket.data.session as SessionPayload | undefined;
    if (session) socket.join(userRoom(session.sub));

    socket.on("auction:join", (auctionId: string) => {
      if (typeof auctionId !== "string" || !auctionId) return;
      socket.join(auctionRoom(auctionId));
    });

    // Acked so the dashboard can distinguish "connected but not authorized"
    // from "connected and receiving" instead of silently showing stale data.
    socket.on("admin:join", (ack?: (result: { ok: boolean }) => void) => {
      const session = socket.data.session as SessionPayload | undefined;
      if (!isStaff(session)) {
        if (typeof ack === "function") ack({ ok: false });
        return;
      }
      socket.join(ADMIN_AUCTION_ROOM);
      if (typeof ack === "function") ack({ ok: true });
    });

    socket.on("admin:leave", () => {
      socket.leave(ADMIN_AUCTION_ROOM);
    });

    socket.on("auction:leave", (auctionId: string) => {
      if (typeof auctionId !== "string" || !auctionId) return;
      socket.leave(auctionRoom(auctionId));
    });

    // Send -> server validation -> moderation check -> only then save +
    // broadcast. Never send -> display -> delete: a rejected message must
    // never reach ChatMessage or io.emit, not even for a moment, so no
    // other connected client — including the sender's own other tabs —
    // can ever see it.
    socket.on("chat:message", async (rawText: unknown) => {
      const session = socket.data.session as { sub: string } | undefined;
      if (!session) {
        socket.emit("chat:error", "يجب تسجيل الدخول للمشاركة في الدردشة");
        return;
      }

      // Gate on rate limit before any validation/DB work so a flooding
      // client is turned away as cheaply as possible.
      if (!rateLimit(`chat:${session.sub}`, 10, 10_000)) {
        socket.emit("chat:error", "الرجاء الانتظار قبل إرسال رسالة أخرى");
        return;
      }

      const parsed = chatMessageSchema.safeParse({ text: rawText });
      if (!parsed.success) {
        socket.emit("chat:error", parsed.error.issues[0]?.message ?? "رسالة غير صالحة");
        return;
      }
      const text = parsed.data.text;

      try {
        // One lookup covers both the chat-block gate and (on the success
        // path below) the display name, instead of querying User twice.
        const user = await User.findById(session.sub).select("name chatBlocked");
        if (user?.chatBlocked) {
          socket.emit("chat:error", "تم حظرك من المشاركة في الدردشة.");
          return;
        }

        const moderation = await checkMessage(text);
        if (!moderation.allowed) {
          // The log survives even though the message never does — the
          // whole point is an admin can still see what was attempted.
          // Never let a logging failure be the reason a bad message
          // reaches the chat, so this is caught on its own.
          try {
            await ChatModerationLog.create({
              user: session.sub,
              messageText: text,
              reason: "الرسالة تحتوي على كلمة محظورة",
              violationType: "blocked_word",
              matchedWords: moderation.matchedWords ?? [],
            });
          } catch (logErr) {
            console.error("chat moderation log write failed:", logErr);
          }
          // Deliberately generic — the blocked-word list itself is never
          // exposed to the sender.
          socket.emit("chat:error", "لم يتم إرسال رسالتك لأنها تحتوي على محتوى غير مسموح.");
          return;
        }

        const message = await ChatMessage.create({ user: session.sub, text });

        io.emit("chat:message", {
          id: String(message._id),
          text: message.text,
          userId: session.sub,
          userName: user?.name ?? "مستخدم",
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error("chat message persist failed:", err);
      }
    });

    socket.on("disconnect", () => {
      // Socket.IO auto-removes the socket from all rooms on disconnect.
    });
  });

  setIO(io);

  // Server-side auction clock: no client/browser needs to be open for
  // scheduled auctions to go live or for expired auctions to finalize.
  const TICK_MS = 5000;
  setInterval(() => {
    getAuctionService()
      .then(({ activateScheduledAuctions, finalizeExpiredAuctions }) =>
        Promise.all([activateScheduledAuctions(), finalizeExpiredAuctions()])
      )
      .catch((err) => console.error("auction scheduler tick failed:", err));
  }, TICK_MS);

  httpServer.listen(port, host, () => {
    console.log(`Mazad server ready on http://${host}:${port}`);
  });

  connectDB()
    .then(async () => {
      console.log("MongoDB connected");
      await warmPublicHome();
    })
    .catch((err) => console.error("Initial MongoDB connection failed:", err));

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    io.close();
    httpServer.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
