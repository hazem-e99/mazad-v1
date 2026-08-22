# مزاد (Mazad) — Saudi License Plate Auction Platform

A full-stack simulator for Saudi vehicle-plate auctions: realtime bidding, VIP/exclusive plate listings, direct purchase, an admin dashboard, RBAC, and bilingual (Arabic/English) UI — built on Next.js and MongoDB.

## Technology Stack

| Layer | Choice | Version (installed) |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.2 |
| UI | React | 19.2.8 |
| Language | TypeScript | 5.x (strict) |
| Database | MongoDB (Atlas) via Mongoose | mongoose 9.9.3 |
| Realtime | Socket.IO | 4.8.3 (server + client) |
| Styling | Tailwind CSS | v4 |
| Validation | Zod | 4.4.3 |
| Auth | Custom JWT session (httpOnly cookie) + bcryptjs | jsonwebtoken 9.0.3, bcryptjs 3.0.3 |
| Images | sharp (server-side resize/webp) | 0.35.3 |
| Client state | zustand (toasts) | 5.0.15 |
| Tests | vitest | 4.x |
| Runtime | Node.js | 24.x |

Next.js is served through a **custom Node server** (`server/index.ts`) that hosts both the Next.js request handler and a Socket.IO server on the same HTTP server/port — required because Socket.IO needs a long-lived process, which Next's default serverless-style dev/build model doesn't provide on its own.

## Project Structure

```
server/            Custom server entrypoint (Next + Socket.IO) and DB seed script
src/
  app/              Next.js App Router pages and API routes
    api/            REST endpoints (auth, plates, auctions, bids, purchase, uploads, stats, users, ads, chat, health)
    admin/          Admin dashboard (plates, auctions incl. detail/status/background, bids, users, VIP, ads, audit log, stats)
    auctions/[id]/  Auction detail page with live bidding UI
    ...             Public pages: home, auctions, vip, ads, chat, login/register, plate/ad submission
  components/       UI primitives (Button, Card, Badge, Input, Table, Pagination, FilterBar...), layout, auction, plate, i18n components
  locales/          Arabic/English message catalogs (ar.ts, en.ts) sharing one typed schema
  models/           Mongoose schemas (User, Plate, Auction, Bid, Purchase, AuditLog, Advertisement, ChatMessage)
  services/         Business logic (auctionService: bidding, purchase, finalization, scheduler)
  lib/              db connection, auth/session, i18n, validation, constants, rate limiting, storage, socket helpers, test guards
  hooks/            Client hooks (useAuctionSocket, useToast)
  types/            Shared frontend types
  __tests__/        API integration test harness (spawns a real production server) + tests
```

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB (Atlas) connection string |
| `AUTH_SECRET` | Secret used to sign session JWTs |
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP port for the custom server |
| `UPLOAD_DIR` | Local filesystem path for uploaded images (auction backgrounds, ad/plate photos) |

**Note on this dev environment:** if `mongodb+srv://` DNS resolution fails locally (some local resolvers can't answer SRV/TXT records), `src/lib/db.ts` automatically retries once against public DNS (1.1.1.1 / 8.8.8.8) before giving up. This is transparent and does not require configuration.

## Installation & Development

```bash
npm install
npm run seed    # populates dev users, plates, and auctions (see credentials below)
npm run dev     # starts the custom server (Next.js + Socket.IO) on $PORT
```

Other scripts:

```bash
npm run build      # production build (Turbopack)
npm run start      # run the production build via the custom server
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # runs the full suite (service-layer + RBAC unit tests + API integration tests)
npm run test:unit  # service-layer + RBAC-logic tests only (fast, no server spawn)
npm run test:api   # builds the app, then runs API integration tests against a real spawned server
```

### Development seed credentials

Seed data is for local development only — never auto-seeded in production.

| Role | Phone | Password |
|---|---|---|
| Admin | `0500000001` | `Admin@12345` |
| Supervisor (granted `auction:create`, `auction:manage`, `plate:manage`) | `0500000002` | `User@12345` |
| Regular users | `0501111100` … `0501111104` | `User@12345` |

## Auction Lifecycle & State Machine

```
draft → scheduled → live → sold | unsold | purchased | cancelled
any non-terminal state → cancelled
```

Transitions are enforced centrally in `src/lib/constants.ts` (`AUCTION_TRANSITIONS`) and validated server-side in the auctions PATCH route. Critically, **`sold`/`unsold` can never be written directly** through the generic status-update route — the API explicitly rejects that (`لا يمكن تعيين نتيجة المزاد يدويًا`) because those results must carry a computed `winner`/`finalPrice` alongside the status. The only way to reach them is `finalizeAuction()` (via the scheduler, or an admin's explicit "end auction now" action at `/api/auctions/[id]/finalize`), which computes and writes both atomically. This closes a real gap where a naive admin status dropdown could otherwise corrupt auction results.

A background scheduler in `server/index.ts` ticks every 5 seconds to:
- move `scheduled` auctions whose `startAt` has passed into `live` (via a per-document conditional update — safe if multiple app instances ever run the scheduler concurrently, since a losing attempt's filter simply won't match)
- finalize `live` auctions whose `endAt` has passed into `sold`/`unsold`

This runs independent of any connected browser and is restart-safe: since activation/finalization are driven by absolute timestamps compared against conditional-update filters, a restarted process's next tick immediately catches up on anything overdue with no duplicate side effects.

## Concurrency Strategy (Bidding & Direct Purchase)

All bid and purchase writes use **conditional atomic updates** (`findOneAndUpdate` with a filter that re-checks `status`, `currentPrice`, and a monotonic `version` field), not a read-compare-write pattern in application memory:

1. Read the auction to validate business rules (auction live, within time window, bid ≥ current price + increment).
2. Attempt `Auction.findOneAndUpdate({ _id, status: "live", currentPrice: <price at read time>, version: <version at read time> }, { $set: ..., $inc: { version: 1 } })`.
3. If another request already won the race, the filter no longer matches (price/version changed), the update returns `null`, and this request is rejected with a clear "outbid" error — no partial/corrupted state is possible.

The same pattern secures direct purchase against: a simultaneous winning bid, a second simultaneous purchase, and purchasing an already-closed auction. A unique index on `Purchase.auction` is a second line of defense against double-purchase records.

Auction finalization is **idempotent**: it only transitions documents still in `live` status, so a retried scheduler tick or duplicate call is a no-op.

See `src/services/auctionService.ts` and its tests in `src/services/__tests__/auctionService.test.ts`.

## Realtime Architecture

- One Socket.IO server shares the HTTP server with Next.js (`server/index.ts`).
- Clients join a per-auction room (`auction:<id>`) via `auction:join` — events are scoped to that room, not broadcast globally.
- Server emits `auction:event` with a typed payload (`bid_accepted`, `auction_started`, `auction_finalized`, `direct_purchase`, etc.) whenever `auctionService` mutates an auction.
- A lightweight global chat also runs over the same socket (`chat:message`), persisted to MongoDB and rate-limited per user.
- Socket auth reads the same httpOnly session cookie used by the REST API (parsed in the Socket.IO `io.use` middleware).
- **Single-instance constraint:** Socket.IO room membership lives in this process's memory. Scaling to multiple app instances would require a Socket.IO Redis adapter to fan out events correctly — not configured here (see `ecosystem.config.js`). The database layer itself is already safe under multiple instances; only realtime delivery is the constraint.

## Security

- Passwords hashed with bcrypt (cost factor 12); sessions are JWTs in httpOnly, sameSite=lax cookies (secure in production).
- RBAC: `role` (`user`/`supervisor`/`admin`) plus a granular `permissions` array (e.g. `plate:create_featured`, `auction:create`, `auction:sell`, `auction:buy`, `user:manage`, `ad:manage`, `upload:manage`, `audit:view`, ...). Admins implicitly hold all permissions; supervisors hold only what's explicitly granted via the admin Users screen. Enforced server-side on every mutating route via `requirePermission()` — never only hidden in the UI. Verified with 21 automated permission-logic tests plus API-level integration tests asserting real 403s.
- Login is rate-limited and locks an account for 15 minutes after 5 failed attempts.
- Bidding, purchase, registration, uploads, and ad creation are all rate-limited per user/IP.
- File uploads validate MIME type and size, and are re-encoded through `sharp` (strips embedded metadata, normalizes to webp). Auction-background uploads additionally require `upload:manage`; ad/plate photos only require authentication (ordinary consumer action).
- Zod validates all API input; errors return Arabic-friendly messages without leaking stack traces in production.
- MongoDB URI and JWT secret are read only from environment variables — never hardcoded, never sent to the client, never logged. Confirmed via a client-bundle grep and no `NEXT_PUBLIC_*` usage anywhere in the codebase.
- `/api/health` reports DB connectivity for uptime monitoring without exposing infrastructure details.

## Localization (Arabic + English)

A centralized i18n architecture — not scattered `locale === "ar" ? ... : ...` ternaries:

- `src/locales/ar.ts` / `src/locales/en.ts`: flat, typed message catalogs sharing one `MessageCatalog` interface (a missing English key is a TypeScript error, not a silent gap).
- `src/lib/i18n.ts` / `src/lib/i18n-server.ts`: locale resolution (cookie-based, no URL segment routing), `resolveMessage()` key lookup, `dirForLocale()` for RTL/LTR.
- `LocaleProvider` (client context) + `useTranslations()` hook for client components; `getServerTranslator()` for server components — both read the same `mazad_locale` cookie so server and client render consistently.
- `LanguageSwitcher` in the header toggles the cookie and refreshes; `<html lang dir>` updates accordingly (verified: `en` → `dir="ltr"`, `ar` → `dir="rtl"`).
- `formatSar()`/`formatDateTime()` in `src/lib/format.ts` take a locale and use the matching `Intl` formatter (not just swapped strings).

**Coverage:** Every public page and every admin screen (dashboard, plates, auctions incl. detail/status/background upload, users incl. the permissions dialog, bids, VIP, ads, audit log, stats) plus shared UI (Pagination, FilterBar, Toaster, dialogs) and generic API error messages (unauthorized/forbidden/rate-limited/validation/internal — localized at the response boundary by error `code`, without threading locale through every throw site) are fully translated. A small automated script confirms both catalogs carry exactly the same 317 keys (`ar`/`en` parity, zero missing either direction) — this exists because a message added to one catalog's value object without updating the shared `MessageCatalog` interface can silently compile with a missing key in the other locale (TypeScript's excess-property checking doesn't catch it in this pattern); the parity script is the guard against that recurring. Verified end-to-end (curl against a running production build with the locale cookie set) across 8+ pages in both languages, confirming `lang`/`dir` attributes, translated content, and no leaked raw translation-key literals or stray untranslated strings.

Free-form business-logic error messages (e.g. "يجب أن تكون المزايدة 1200 ريال على الأقل", thrown from deep inside `auctionService.ts`) remain Arabic-only — localizing those would require threading a request-scoped locale through the entire service layer, a materially larger change than the fixed, enumerable set of structural errors that are localized.

## Accessibility

- **Contrast:** all text/background token pairs verified against WCAG AA/AAA by computed contrast ratio. Fixed one real failure this pass: `--color-text-faint` (used for timestamps and secondary metadata across 17 files) was 3.4–3.6:1 against the app's dark backgrounds — below the 4.5:1 required for small text. Lightened to clear 4.7–5.0:1 while staying visually distinct from `--color-text-muted`.
- **Keyboard/focus:** all interactive controls are real `<button>`/`<a>`/form elements (never `<div onClick>`), with visible `focus-visible` rings from the shared `Button`/`Input` primitives. The permissions-edit dialog (`UserRoleEditor`) traps focus, closes on Escape, and closes on backdrop click — it was a plain unmanaged modal before this pass.
- **Forms:** every `Input` associates its `<label>` via `htmlFor`, links `aria-describedby` to both hint and error text, sets `aria-invalid`, and announces validation errors via `role="alert"`.
- **Realtime announcements:** toasts (`aria-live="polite"`, `role="status"`) announce new bids, finalization, and purchase events without stealing focus; the auction detail page's live connection indicator is now also a `role="status"` live region (previously silent).
- **Locale-correct accessible names:** fixed a real bug where `PlateRenderer`'s `aria-label` — used on every rendered plate throughout the app — stayed hardcoded Arabic regardless of the active locale, so an English-mode screen reader user heard Arabic on every plate. Now threads the active locale through and uses the same message catalog as the rest of the UI.
- **Reduced motion:** a global `prefers-reduced-motion: reduce` media query disables animation/transition durations app-wide.

## Testing

```bash
npm test
```

- **`src/services/__tests__/auctionService.test.ts`** (22 tests): valid/invalid bids, minimum-increment enforcement, scheduled/expired auction rejection, concurrent identical bids (exactly one winner), an 8-concurrent-bidder stress test asserting no corrupted price/version/bidCount, direct purchase (including concurrent purchase and bid-vs-purchase races), finalization idempotency, end-time races (bid vs. scheduler finalization), and scheduler restart-safety (`activateScheduledAuctions`/`finalizeExpiredAuctions` run twice without duplicating results).
- **`src/lib/__tests__/rbac.test.ts`** (21 tests): permission resolution for user/supervisor(no permission)/supervisor(granted)/admin across every permission type, and auction state-machine integrity (sold/unsold only reachable from `live`, terminal states have no outgoing transitions).
- **`src/__tests__/api/apiIntegration.test.ts`** (17 tests): spawns the actual production build as a child process on a dedicated port and drives it with real `fetch`/cookies — health check, login success/failure, session persistence, RBAC 403s at the HTTP layer (plate VIP-flagging, auction creation, manual sold/unsold rejection), valid/invalid bids over HTTP, and permission-gated stats/users endpoints.

All 62 tests run against the real configured MongoDB database using uniquely-tagged, self-cleaning documents (never touching seed/dev data) — `src/lib/testGuard.ts` fails fast if `MONGODB_URI` isn't set, and every test file's cleanup query is scoped to IDs the test run itself created, never an unscoped `deleteMany({})`. Verified stable across repeated full-suite runs (no flakiness) after fixing a real bug the tests originally surfaced: `finalizeAuction()` was silently returning a stale pre-update snapshot instead of the auction's actual state when its conditional update lost a race — now it re-fetches on that path.

**Why the API test harness runs a production build:** Next.js dev mode maintains a filesystem lock (`.next/dev/lock`) that refuses a second concurrent `next dev`-based process for the same project directory regardless of port — which would break `npm test` whenever a developer also has `npm run dev` open. Production mode has no such lock, so `npm run test:api` builds first.

## Deployment (Linux VPS)

1. `npm ci && npm run build`
2. Set environment variables (`MONGODB_URI`, `AUTH_SECRET`, `NODE_ENV=production`, `PORT`, `UPLOAD_DIR`) outside of any committed file.
3. Run with PM2 using the provided `ecosystem.config.js`: `pm2 start ecosystem.config.js` (single instance — see the realtime-architecture note above on why not to scale to cluster mode without a Socket.IO Redis adapter).
4. Put Nginx in front as a reverse proxy — see `nginx.conf.example` for a ready-to-adapt config that proxies both regular HTTP and the `/socket.io/` WebSocket upgrade to the same upstream, terminates TLS, and exposes `/api/health` for uptime monitoring.
5. The custom server handles `SIGTERM`/`SIGINT` for graceful shutdown (closes Socket.IO, drains the HTTP server, force-exits after a 10s grace period) — compatible with PM2/systemd stop signals.
6. Ensure `UPLOAD_DIR` points at a persistent volume (uploaded images are plain files on disk); the storage layer in `src/lib/storage.ts` is isolated behind `saveImage`/`deleteImage` so it can be swapped for S3-compatible object storage later without touching calling code.

## Known Limitations / Remaining Work

Every original major feature area is COMPLETE — see the Final Status Summary in `IMPLEMENTATION_PROGRESS.md` for the full requirement-by-requirement matrix. The genuinely remaining gaps are depth/polish items on otherwise working, tested capabilities, not missing features:

1. **Mobile card layouts** exist for the 5 highest-traffic admin screens (auctions, plates, users, bids, audit log); VIP/ads/stats still use responsive column-hiding rather than dedicated stacked cards. Usable at every width with no horizontal overflow, just less polished than the five upgraded screens.
2. **Business-logic error messages stay Arabic-only** regardless of locale (bid/purchase rejection reasons thrown deep in `auctionService.ts`) — see the Localization section above for why this was scoped out.
3. **No dedicated API integration test files** for ads/uploads/VIP-specific flows — those are exercised indirectly as setup steps in other tests, not as their own RBAC-matrix suite the way plates/auctions/users/bids are.
4. **No physical mobile device testing** — mobile layouts were verified via responsive breakpoint review and structural inspection, not on an actual device or browser devtools emulation session.
