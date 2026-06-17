// GripCast contribution Worker — receives a lap-data contribution from the app:
// stores the raw .xrk in R2 and a metadata row in D1. Pull these offline with the
// tools/ pipeline to refit the grip -> lap-time model for each track.
//
// This is a public, unauthenticated endpoint, so every input is size-capped and
// validated/clamped before it touches storage.
//
// Bindings are typed `any` so this deploys with zero extra deps. For full editor
// types: `npm i -D @cloudflare/workers-types` and set XRK_BUCKET:R2Bucket, DB:D1Database.
interface Env {
  XRK_BUCKET: any; // R2Bucket
  DB: any; // D1Database
  ALLOWED_ORIGIN?: string;
}

const MAX_BODY = 12 * 1024 * 1024; // 12 MB total request
const MAX_FILE = 8 * 1024 * 1024; // 8 MB .xrk
const MAX_LAPS = 5000;

function cors(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

function slug(s: string): string {
  return (s || "track").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 40).toLowerCase() || "track";
}

function num(v: unknown, lo: number, hi: number): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
}
function str(v: unknown, max: number): string | null {
  return v == null ? null : String(v).slice(0, max);
}

function cleanMeta(m: any) {
  const rawLaps = Array.isArray(m && m.laps) ? m.laps : [];
  const laps = rawLaps.slice(0, MAX_LAPS).map(Number).filter((x: number) => Number.isFinite(x) && x > 0 && x < 100000);
  return {
    track: str(m && m.track, 120),
    lat: num(m && m.lat, -90, 90),
    lon: num(m && m.lon, -180, 180),
    klass: str(m && m.klass, 40),
    handle: str(m && m.handle, 40),
    date: str(m && m.date, 40),
    time: str(m && m.time, 40),
    nLaps: num(m && m.nLaps, 0, 1000000),
    best: num(m && m.best, 0, 100000),
    laps,
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || "*";
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });
    if (req.method === "GET" && url.pathname === "/") return new Response("gripcast-contrib ok\n", { headers: cors(origin) });
    if (req.method !== "POST" || url.pathname !== "/contribute") return json({ error: "not found" }, 404, origin);

    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_BODY) return json({ error: "payload too large" }, 413, origin);

    try {
      const form = await req.formData();
      let meta: any = {};
      try { meta = cleanMeta(JSON.parse((form.get("meta") as string) || "{}")); } catch { return json({ error: "bad meta" }, 400, origin); }
      const file = form.get("file");
      const id = crypto.randomUUID();

      let fileKey: string | null = null;
      if (file && typeof file !== "string") {
        if (file.size > MAX_FILE) return json({ error: "file too large" }, 413, origin);
        fileKey = `xrk/${slug(meta.track || "track")}/${id}.xrk`;
        await env.XRK_BUCKET.put(fileKey, file.stream(), {
          httpMetadata: { contentType: "application/octet-stream" },
        });
      }

      await env.DB.prepare(
        `INSERT INTO contributions
           (id, track, lat, lon, klass, handle, session_date, session_time, n_laps, best_lap, laps_json, file_key, ua, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
        .bind(
          id,
          meta.track,
          meta.lat,
          meta.lon,
          meta.klass,
          meta.handle,
          meta.date,
          meta.time,
          meta.nLaps,
          meta.best,
          JSON.stringify(meta.laps),
          fileKey,
          str(req.headers.get("user-agent"), 300),
          new Date().toISOString()
        )
        .run();

      return json({ ok: true, id }, 200, origin);
    } catch (e: any) {
      return json({ error: String((e && e.message) || e) }, 400, origin);
    }
  },
};
