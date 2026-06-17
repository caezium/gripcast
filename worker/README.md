# GripCast contribution Worker

Receives lap-data contributions from the app and stores them for offline refitting:
raw `.xrk` → **R2** (`gripcast-xrk`), metadata row → **D1** (`gripcast.contributions`).

All steps below need your Cloudflare auth (`npx wrangler login`).

## Provision once

```bash
cd worker

# R2 bucket for raw files
npx wrangler r2 bucket create gripcast-xrk

# D1 database — copy the printed database_id into wrangler.toml
npx wrangler d1 create gripcast

# create the table (remote)
npx wrangler d1 execute gripcast --remote --file=schema.sql

# deploy — prints the endpoint, e.g. https://gripcast-contrib.<you>.workers.dev
npx wrangler deploy
```

## Point the app at it

Put the deployed URL in the app's environment and rebuild:

```bash
# in the repo root, .env (or .env.production)
VITE_CONTRIBUTE_URL=https://gripcast-contrib.<you>.workers.dev
```

```bash
SCGUARD_BYPASS=1 npm run build
```

Until `VITE_CONTRIBUTE_URL` is set, the Contribute feature still parses files and
shows the user their own laps — it just doesn't upload.

## Pull contributions for refitting

```bash
npx wrangler d1 execute gripcast --remote \
  --command "SELECT track, klass, session_date, best_lap, n_laps, file_key FROM contributions ORDER BY created_at DESC LIMIT 50"

# raw files
npx wrangler r2 object get gripcast-xrk/<file_key> --file ./incoming.xrk
```

Feed these into `tools/` (decode → pair with historical weather → refit per-track grip→lap model).

## Notes
- `ALLOWED_ORIGIN` in `wrangler.toml` is `*` by default; set it to `https://grip.henryzh.dev` to lock the endpoint to the site.
- Cross-driver laps best calibrate the **relative** condition penalty curve (wet step, heat, etc.); absolute baselines are most reliable from same-driver multi-session data. Bucket by `klass` before fitting.
