# Mazad — Production Deployment (lwh7.com)

Automated deployment for a fresh **Ubuntu 24.04** VPS at `162.0.223.132`,
serving the app at `https://lwh7.com`. MongoDB stays on **Atlas** — nothing
is installed locally (the VPS has no AVX, which MongoDB 5+ requires).

## Architecture

This app is **one process**, not a separate frontend/backend: `server/index.ts`
runs a custom Node server that hosts the Next.js request handler *and* a
Socket.IO server on the same HTTP port. There is no API server to deploy
separately — `/api/*` routes live inside the same Next.js app. Because of
that, this deployment uses a **single systemd service** and a **single
Nginx upstream**, not the two-service split you'd use for a real
frontend/backend split.

```
Internet
   |
   v
https://lwh7.com  (Nginx: TLS, www + http redirects, /socket.io upgrade)
   |
   v
127.0.0.1:$PORT  (lwh7-app.service: Next.js + Socket.IO, one Node process)
   |
   v
MongoDB Atlas (MONGODB_URI)
```

Public images (plate photos, ads, site assets) are stored **in MongoDB**
(`SiteAsset` model, served via `/api/site-assets/<key>`) — not on disk.
The only thing on local disk that must survive redeploys is the private
ownership-document uploads directory (`PRIVATE_UPLOAD_DIR`).

## 1. DNS

Point both records at the server before requesting SSL:

```
A     @      162.0.223.132
A     www    162.0.223.132
```

Deployment works fine before DNS propagates — the app is served over
plain HTTP in the meantime (see step 4).

## 2. Get the code onto the VPS

```bash
ssh root@162.0.223.132
git clone https://github.com/hazem-e99/mazad-v1.git
cd mazad-v1
```

(Or `rsync`/`scp` your local checkout instead of cloning — either way,
`deploy-production.sh` operates on whatever checkout it's run from.)

## 3. Environment variables

The production `.env` lives at `/opt/lwh7/shared/env/.env` (mode `600`,
owned by the `lwh7` service user), **outside** any release directory, so
it survives every redeploy and is never touched by `git`.

- On first run, `deploy.sh` seeds it from this repo's local `.env` if one
  is present (the source of truth per the project's own instructions),
  otherwise from `.env.example`.
- It then aborts if `MONGODB_URI` or `AUTH_SECRET` are empty — it will
  **never fabricate secrets**. Edit the file on the server and re-run:

  ```bash
  nano /opt/lwh7/shared/env/.env
  sudo ./deploy-production.sh
  ```

- The only values the script sets/overwrites itself are deployment
  infrastructure, not secrets: `NODE_ENV=production`, `HOST=127.0.0.1`,
  and `NEXT_PUBLIC_SITE_URL=https://lwh7.com` (this replaces the Render
  URL — see "Render → lwh7.com changes" below). `PORT` is only *seeded*
  (default `3000`) if the file doesn't already have one — an existing
  `PORT` (e.g. `4100`) is never overwritten. Every script resolves the
  real port from this file at runtime (`lib/common.sh:resolve_app_port`),
  so Nginx, health checks, and the systemd unit always agree with it —
  there's nothing else to update if you change it.

Variables actually read by the app (see repo's own `README.md` /
`.env.example`): `MONGODB_URI`, `AUTH_SECRET`, `NODE_ENV`, `PORT`,
`PRIVATE_UPLOAD_DIR` (optional, defaults to `./private-uploads`),
`NEXT_PUBLIC_SITE_URL`. There is no separate `CORS_ORIGIN` / `SOCKET_URL`
/ `CLIENT_URL` — the app is same-origin end to end (cookies are
`sameSite=lax`, Socket.IO connects with no explicit URL).

## 4. Deploy

```bash
chmod +x deploy-production.sh
sudo ./deploy-production.sh
```

This single command:
- installs system packages, Node.js 22, Nginx, Certbot, UFW (idempotent —
  safe to re-run);
- adds a 2G swapfile if the VPS has <2GB RAM and none exists yet (guards
  against `next build` running out of memory);
- creates the `lwh7` service user and `/opt/lwh7` release layout;
- builds the first release (`npm ci` + `next build`) and only then points
  `/opt/lwh7/current` at it;
- installs and starts `lwh7-app.service` (systemd, auto-restart, starts
  on boot);
- configures Nginx and UFW (OpenSSH, HTTP, HTTPS only — app port and
  MongoDB stay unreachable from the internet);
- checks DNS, and provisions SSL automatically if it already points here
  — otherwise finishes over HTTP and tells you to run `setup-ssl.sh`
  later.

## 5. SSL (if DNS wasn't ready during step 4)

```bash
sudo deployment/setup-ssl.sh
```

Re-checks DNS, obtains the Let's Encrypt certificate (HTTP-01 via
webroot), switches Nginx to the full HTTPS config (HTTP→HTTPS and
www→non-www redirects, security headers, `/socket.io/` upgrade support),
and enables `certbot.timer` for automatic renewal (with an Nginx-reload
deploy hook so renewals take effect without manual action).

## 6. Day-to-day operations

```bash
./deployment/status.sh          # service, Nginx, local/public health, SSL, Atlas connectivity
./deployment/logs.sh            # follow app logs (journalctl)
./deployment/logs.sh nginx      # follow Nginx error log
sudo ./deployment/restart.sh    # restart the app, confirms it comes back healthy
```

## 7. Deploying updates

```bash
cd mazad-v1        # the same checkout you deployed from
git pull            # optional — update.sh does this itself if the dir is a git checkout
sudo ./deployment/update.sh
```

`update.sh`: pulls the `main` branch (fast-forward only — it refuses to
run over uncommitted local changes), builds a **new** release directory,
and only swaps `/opt/lwh7/current` and restarts the service once the
build succeeds. If the new release fails its health check after
restart, it **automatically rolls back** to the previous release. The
shared `.env`, private-uploads, and public-uploads directories are
untouched by every update — they live outside the release tree.

Manual rollback to an older release:

```bash
sudo ./deployment/rollback.sh                  # previous release
sudo ./deployment/rollback.sh 20260825120000   # a specific release
```

## 8. Disk layout

```
/opt/lwh7/
├── current -> releases/20260825120000/   # symlink, atomically swapped per deploy
├── releases/<timestamp>/                 # one full build per deploy (npm ci + next build)
└── shared/
    ├── env/.env                          # production secrets, mode 600, persists forever
    ├── private-uploads/                  # ownership-document uploads, persists forever
    └── public-uploads/                   # persists forever (release symlinks this at public/uploads)
```

Each release directory symlinks `.env`, `private-uploads`, and
`public/uploads` back to these shared copies, so nothing in a release is
ever the source of truth for any of them.

If the source checkout you run `deploy-production.sh`/`update.sh` from
*is* `/opt/lwh7` itself (cloning straight into the deploy path, rather
than into a separate checkout elsewhere), `deployment/lib/release.sh`
explicitly excludes `/current`, `/releases`, and `/shared` — using
root-anchored rsync patterns — from the copy that builds each release,
specifically so that `releases/` (which contains the release currently
being built) is never copied into itself.

## 9. Ports & processes

| Component | Bind | Notes |
|---|---|---|
| App (`lwh7-app.service`) | `127.0.0.1:$PORT` | `$PORT` comes from `/opt/lwh7/shared/env/.env` (defaults to `3000` if unset — this VPS currently runs `4100`); Next.js + Socket.IO in one process, not reachable from the internet directly |
| Nginx | `0.0.0.0:80`, `0.0.0.0:443` | Only public entry point (UFW allows just SSH/80/443) |
| MongoDB | n/a | Atlas, over the internet via `MONGODB_URI`; port 27017 is never opened on this VPS |

## 10. MongoDB Atlas

Used exactly as in local development — `src/lib/db.ts` connects via
`MONGODB_URI` (mongoose) and even retries once against public DNS
resolvers if `mongodb+srv://` SRV lookups fail locally. Nothing about
Atlas changes for this deployment; no local MongoDB is installed and none
should be.

## Render → lwh7.com changes made

- `src/app/layout.tsx`: the hardcoded fallback site URL (used only when
  `NEXT_PUBLIC_SITE_URL` is unset) changed from
  `https://mazad-v1.onrender.com` to `https://lwh7.com`. Setting
  `NEXT_PUBLIC_SITE_URL=https://lwh7.com` in production (done
  automatically by `deploy.sh`) takes precedence over this fallback
  either way.
- `render.yaml` and `RENDER_DEPLOY.md` are left in place (harmless,
  documented as the short-lived Render test deploy they were built for)
  — nothing reads them once the app runs on the VPS.
- No other Render-specific code, CORS, or cookie configuration existed to
  change — the app was already same-origin and environment-driven.

## Manual actions still required

1. Point DNS (`A @` and `A www` → `162.0.223.132`) — cannot be automated
   from here.
2. Fill in real secrets in `/opt/lwh7/shared/env/.env` on first deploy
   (`MONGODB_URI`, `AUTH_SECRET`) — deliberately never automated.
3. If DNS wasn't ready during the first deploy, run
   `sudo deployment/setup-ssl.sh` once it is.
