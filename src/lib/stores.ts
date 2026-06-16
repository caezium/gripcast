import { writable, derived, get } from "svelte/store";
import { fetchWeather, fetchHourly, liveW, hourW, hourIndex, peakHour, type Weather, type Hourly } from "./weather";
import { trackLength, type Place } from "./geo";
import { scoreOf, type W } from "./score";
import { computeSky, phaseAt, type SkyOut, type Phase } from "./sky";
import { trackNow, minFromISO, lsSet } from "./util";

export interface AppState {
  lat: number | null; lon: number | null; name: string;
  data: Weather | null; tzOffset: number; tzAbbr: string; todayISO: string | null; todayIdx: number;
  hourly: Record<string, Hourly>; selDate: string | null; selHour: number; live: boolean;
  loading: boolean; error: boolean; trackLengthM: number | null;
}
const init: AppState = {
  lat: null, lon: null, name: "", data: null, tzOffset: 0, tzAbbr: "", todayISO: null, todayIdx: 0,
  hourly: {}, selDate: null, selHour: 12, live: true, loading: false, error: false, trackLengthM: null,
};
export const app = writable<AppState>(init);

export interface ViewModel { w: W; idx: number; phase: Phase; sky: SkyOut; score: ReturnType<typeof scoreOf>; live: boolean; selDate: string; selHour: number; }

export const view = derived(app, ($a): ViewModel | null => {
  if (!$a.data || !$a.selDate) return null;
  const hd = $a.hourly[$a.selDate];
  let w: W;
  if ($a.live || !hd || !hd.code.length) w = liveW($a.data);
  else { const hi = hourIndex(hd, $a.selHour); w = hi >= 0 ? hourW(hd, hi) : liveW($a.data); }
  const idx = $a.data.daily.time.indexOf($a.selDate);
  const sr = minFromISO($a.data.daily.sunrise[idx]);
  const ss = minFromISO($a.data.daily.sunset[idx]);
  const localMin = $a.live ? trackNow($a.tzOffset).min : $a.selHour * 60 + 30;
  const phase = phaseAt(localMin, sr, ss);
  const sky = computeSky({ phase, cloud: w.cloud, precip: w.precip, wind: w.wind, temp: w.temp });
  return { w, idx, phase, sky, score: scoreOf(w), live: $a.live, selDate: $a.selDate, selHour: $a.selHour };
});

/* ---------- recents / last ---------- */
export interface RecentPlace { name: string; lat: number; lon: number; }
export function recents(): RecentPlace[] { try { const v = JSON.parse(localStorage.getItem("gc_recents") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }
function pushRecent(it: RecentPlace) {
  let r = recents().filter((x) => Math.abs(x.lat - it.lat) > 1e-4 || Math.abs(x.lon - it.lon) > 1e-4);
  r.unshift({ name: it.name, lat: it.lat, lon: it.lon });
  localStorage.setItem("gc_recents", JSON.stringify(r.slice(0, 6)));
}
export const recentsStore = writable<RecentPlace[]>(recents());

export const FEATURED: Place[] = [
  { name: "South Garda Karting", sub: "Lonato, IT", lat: 45.4250, lon: 10.5061 },
  { name: "Franciacorta Karting", sub: "Castrezzato, IT", lat: 45.5519, lon: 9.9897 },
  { name: "Adria Karting Raceway", sub: "Adria, IT", lat: 45.0469, lon: 12.1556 },
  { name: "PF International", sub: "Grantham, UK", lat: 52.9430, lon: -0.6720 },
  { name: "Whilton Mill", sub: "Northants, UK", lat: 52.2680, lon: -1.1010 },
  { name: "Karting Genk", sub: "Genk, BE", lat: 50.9990, lon: 5.5010 },
  { name: "GoPro Motorplex", sub: "Mooresville, US", lat: 35.5840, lon: -80.8660 },
  { name: "New Castle Motorsports", sub: "Indiana, US", lat: 39.9320, lon: -85.3400 },
  { name: "Suzuka Circuit", sub: "Suzuka, JP", lat: 34.8430, lon: 136.5410 },
  { name: "Bahrain Karting", sub: "Sakhir, BH", lat: 26.0330, lon: 50.5110 },
];

/* ---------- actions ---------- */
// monotonic load token — a newer loadPlace invalidates older in-flight responses (no stale overwrite)
let placeSeq = 0;
export async function loadPlace(lat: number, lon: number, name: string) {
  const seq = ++placeSeq;
  app.update((s) => ({ ...s, lat, lon, name, data: null, hourly: {}, error: false, loading: true, trackLengthM: null }));
  pushRecent({ name, lat, lon }); recentsStore.set(recents());
  lsSet("gc_last", { name, lat, lon }, 1e12);
  // circuit length (for length-derived lap baselines) — non-blocking
  trackLength(lat, lon).then((m) => {
    if (m && seq === placeSeq) app.update((s) => ({ ...s, trackLengthM: m }));
  });
  try {
    const d = await fetchWeather(lat, lon);
    if (seq !== placeSeq) return;
    const tzOffset = d.utc_offset_seconds || 0;
    const todayISO = trackNow(tzOffset).dateISO;
    let ti = (d.daily?.time || []).indexOf(todayISO); if (ti < 0) ti = 60; d.todayIdx = ti;
    const p = trackNow(tzOffset);
    app.update((s) => ({ ...s, data: d, tzOffset, tzAbbr: d.timezone_abbreviation || "", todayISO, todayIdx: ti, selDate: todayISO, selHour: p.h, live: true, loading: false }));
    const hd = await fetchHourly(lat, lon, todayISO);
    if (seq !== placeSeq) return;
    app.update((s) => ({ ...s, hourly: { ...s.hourly, [todayISO]: hd } }));
  } catch {
    if (seq === placeSeq) app.update((s) => ({ ...s, error: true, loading: false }));
  }
}
export function setLive() {
  app.update((s) => { const p = trackNow(s.tzOffset); return { ...s, live: true, selDate: s.todayISO, selHour: p.h }; });
}
export async function selectDay(i: number) {
  const s = get(app); if (!s.data) return;
  if (i === s.todayIdx) return setLive();
  const date = s.data.daily.time[i];
  const seq = placeSeq;
  app.update((st) => ({ ...st, live: false, selDate: date }));
  let hd = s.hourly[date];
  if (!hd) { try { hd = await fetchHourly(s.lat!, s.lon!, date); } catch { return; } }
  if (seq !== placeSeq) return;
  app.update((st) => ({ ...st, hourly: { ...st.hourly, [date]: hd }, selHour: peakHour(hd) }));
}
export async function setHour(h: number) {
  const s = get(app); const p = trackNow(s.tzOffset);
  const live = s.selDate === s.todayISO && h === p.h;
  app.update((st) => ({ ...st, selHour: h, live }));
  if (!live && s.selDate && !s.hourly[s.selDate]) {
    const seq = placeSeq;
    let hd: Hourly;
    try { hd = await fetchHourly(s.lat!, s.lon!, s.selDate); } catch { return; }
    if (seq !== placeSeq) return;
    app.update((st) => ({ ...st, hourly: { ...st.hourly, [s.selDate!]: hd } }));
  }
}
