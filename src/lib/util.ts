export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const pad = (n: number) => String(n).padStart(2, "0");

export function minFromISO(iso: string | undefined): number | null {
  if (!iso) return null;
  const tt = iso.split("T")[1];
  if (!tt) return null;
  const [h, m] = tt.split(":");
  return +h * 60 + +m;
}

/** Track-local "now" derived from the venue's UTC offset (seconds). */
export function trackNow(offsetSec: number) {
  const d = new Date(Date.now() + (offsetSec || 0) * 1000);
  return {
    h: d.getUTCHours(),
    m: d.getUTCMinutes(),
    s: d.getUTCSeconds(),
    min: d.getUTCHours() * 60 + d.getUTCMinutes(),
    dateISO: d.toISOString().slice(0, 10),
  };
}

export function haversine(a: number, b: number, c: number, d: number): number {
  const R = 6371,
    dLat = ((c - a) * Math.PI) / 180,
    dLon = ((d - b) * Math.PI) / 180,
    la1 = (a * Math.PI) / 180,
    la2 = (c * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** localStorage cache with TTL. */
export function lsGet<T>(k: string): T | null {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "null");
    if (v && Date.now() - v.t < v.ttl) return v.d as T;
  } catch {}
  return null;
}
export function lsSet(k: string, d: unknown, ttl: number) {
  try {
    localStorage.setItem(k, JSON.stringify({ t: Date.now(), ttl, d }));
  } catch {}
}
