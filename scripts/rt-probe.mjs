/**
 * Realtime smoke probe — connects to the running server and checks that
 * the admin auction feed is wired up end to end.
 *
 * Usage:  node scripts/rt-probe.mjs [baseUrl]
 *
 * With no credentials it can still answer the most common question:
 * "is this server process actually running the admin:join handler?" An
 * unauthenticated join must ack {ok:false}; no ack at all means the
 * process predates the handler and needs restarting.
 */
import { io } from "socket.io-client";

const base = process.argv[2] ?? "http://localhost:4100";

function connect(cookie) {
  return io(base, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    extraHeaders: cookie ? { Cookie: cookie } : undefined,
    reconnection: false,
  });
}

const socket = connect(process.env.MAZAD_COOKIE);

const done = (code, msg) => {
  console.log(msg);
  socket.close();
  process.exit(code);
};

socket.on("connect_error", (err) => done(1, "connect_error: " + err.message));

setTimeout(() => done(1, "TIMEOUT: no response from " + base), 12000).unref?.();

socket.on("connect", () => {
  console.log("connected, id =", socket.id);

  socket.timeout(6000).emit("admin:join", (timeoutErr, result) => {
    if (timeoutErr) {
      done(
        2,
        "NO ACK for admin:join — this server process does not have the handler.\n" +
          "  => restart the dev server so server/index.ts is reloaded."
      );
    }
    console.log("admin:join ack =", JSON.stringify(result));
    if (result?.ok) {
      console.log("JOINED the admin room. Listening for admin:auction_event for 30s...");
      socket.on("admin:auction_event", (event) => {
        console.log(
          "EVENT",
          event.type,
          "auction=" + event.auctionId,
          "price=" + event.snapshot?.currentPrice,
          "bids=" + event.snapshot?.bidCount,
          "status=" + event.snapshot?.status,
          "highestBidder=" + event.snapshot?.highestBidderName,
          "phone=" + event.admin?.bidderPhone
        );
      });
      setTimeout(() => done(0, "done listening"), 30000);
    } else {
      done(
        0,
        "Handler EXISTS and correctly refused an unauthenticated join.\n" +
          "  => server code is current; set MAZAD_COOKIE=mazad_session=... to test an authorised join."
      );
    }
  });
});
