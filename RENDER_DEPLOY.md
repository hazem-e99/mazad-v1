# Render Test Deploy

Use this setup for a short 1-2 day test deploy before moving to the VPS.

## Service

- Type: Web Service
- Runtime: Node
- Plan: Free
- Build Command: `npm ci --include=dev && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/api/health`

If Render detects `render.yaml`, these values are already defined there.

## Environment Variables

Set these in Render:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
AUTH_SECRET=use_a_long_random_secret
NODE_ENV=production
UPLOAD_DIR=./public/uploads
```

Do not set `PORT`; Render injects it automatically.

## Notes

- File uploads are stored on Render's local filesystem for this temporary test.
- Local filesystem uploads can disappear after redeploys/restarts on free hosting.
- `next build` skips TypeScript validation for this temporary deploy because the project currently runs out of memory during the TypeScript phase. Run `npm run lint` locally before deploying.
