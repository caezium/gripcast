import { haversine, lsGet, lsSet } from "./util";

export interface Place { name: string; sub?: string; lat: number; lon: number; isTrack?: boolean; kart?: boolean; }

export function classifyPhoton(f: any): Place {
  const p = f.properties, [lon, lat] = f.geometry.coordinates;
  const isTrack = (p.osm_key === "sport" && p.osm_value === "karting") || p.osm_value === "raceway"
    || (p.osm_key === "leisure" && p.osm_value === "track")
    || /\b(kart|karting|kartodrom|circuit|speedway|raceway|motorsport|racetrack)\b/i.test([p.name, p.street].filter(Boolean).join(" "));
  const sub = [p.city || p.county || p.locality || p.state, p.country].filter(Boolean).join(", ");
  return { name: p.name || p.street || p.city || "Unknown", sub, lat, lon, isTrack };
}

export async function photon(q: string, bias?: { lat: number; lon: number }, lang = "en"): Promise<Place[]> {
  let u = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=10&lang=${["en", "de", "fr"].includes(lang) ? lang : "en"}`;
  if (bias) u += `&lat=${bias.lat}&lon=${bias.lon}`;
  const j = await (await fetch(u)).json();
  return (j.features || []).map(classifyPhoton);
}

const OVERPASS_EPS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const opCache = new Map<string, any>();

async function overpassFetch(ql: string, ms = 10000): Promise<any> {
  if (opCache.has(ql)) return opCache.get(ql);
  const lk = "gc_op_" + ql.length + "_" + ql.slice(0, 40).replace(/\W/g, "");
  const cached = lsGet<any>(lk);
  if (cached) { opCache.set(ql, cached); return cached; }
  const data = "?data=" + encodeURIComponent(ql);
  const attempts = OVERPASS_EPS.map((ep) => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), ms);
    return fetch(ep + data, { signal: ctrl.signal }).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).finally(() => clearTimeout(to));
  });
  const j = await Promise.any(attempts);
  opCache.set(ql, j); lsSet(lk, j, 864e5);
  return j;
}

export async function overpassAround(lat: number, lon: number, km = 40, limit = 25): Promise<Place[]> {
  const r = km * 1000;
  const ql = `[out:json][timeout:25];(nwr["sport"="karting"](around:${r},${lat},${lon});nwr["highway"="raceway"](around:${r},${lat},${lon}););out center ${limit};`;
  const j = await overpassFetch(ql);
  return (j.elements || []).map((el: any) => {
    const tg = el.tags || {}; const la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon; const kart = tg.sport === "karting";
    return { name: tg.name || (kart ? "Kart circuit" : "Racetrack"), sub: tg["addr:city"] || "", lat: la, lon: lo, isTrack: true, kart };
  }).filter((x: Place) => x.lat != null);
}

export async function overpassBBox(b: { s: number; w: number; n: number; e: number }, limit = 60): Promise<Place[]> {
  const ql = `[out:json][timeout:25];(nwr["sport"="karting"](${b.s},${b.w},${b.n},${b.e});nwr["highway"="raceway"](${b.s},${b.w},${b.n},${b.e}););out center ${limit};`;
  const j = await overpassFetch(ql);
  return (j.elements || []).map((el: any) => {
    const la = el.lat ?? el.center?.lat, lo = el.lon ?? el.center?.lon;
    return { name: el.tags?.name || "Unnamed circuit", lat: la, lon: lo, isTrack: true };
  }).filter((x: Place) => x.lat != null);
}

/**
 * Rough circuit length (m) from OSM raceway geometry near a point, or null.
 * Circuits are often drawn as several connected ways, so we sum them; the
 * result is clamped to a plausible kart-lap range and treated as a ballpark
 * (alternate layouts can inflate it — the UI labels it as a map estimate and
 * lets the user override).
 */
export async function trackLength(lat: number, lon: number): Promise<number | null> {
  const ql = `[out:json][timeout:25];way["highway"="raceway"](around:250,${lat},${lon});out geom;`;
  try {
    const j = await overpassFetch(ql);
    let total = 0;
    for (const el of j.elements || []) {
      const g = el.geometry;
      if (!g || g.length < 2) continue;
      for (let i = 1; i < g.length; i++) total += haversine(g[i - 1].lat, g[i - 1].lon, g[i].lat, g[i].lon) * 1000;
    }
    return total >= 500 && total <= 1700 ? Math.round(total) : null;
  } catch {
    return null;
  }
}

export const dist = haversine;
export function dedupe(arr: Place[]): Place[] {
  const seen = new Set<string>();
  return arr.filter((x) => { const k = x.lat.toFixed(3) + "," + x.lon.toFixed(3); if (seen.has(k)) return false; seen.add(k); return true; });
}
export function parseCoords(q: string): { lat: number; lon: number } | null {
  const m = q.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const la = +m[1], lo = +m[2];
  if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) return { lat: la, lon: lo };
  return null;
}
