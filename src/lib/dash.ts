// Per-hour view data + karting "Highlights" for the conditions dashboard.
import { scoreOf } from "./score";
import { hourW, type Hourly } from "./weather";
import { conditionFactor } from "./laptime";
import { airDensity } from "./karting";
import { pad } from "./util";

export interface HourPt {
  h: number; temp: number; feels: number; cloud: number; precip: number; wind: number; gust: number; dir: number;
  code: number; grip: number; pace: number; score: number; mood: string; lap: number | null; rad: number | null;
}

export function buildHours(hd: Hourly, baseline: number | null): HourPt[] {
  const out: HourPt[] = [];
  for (let i = 0; i < hd.code.length; i++) {
    const w = hourW(hd, i);
    const s = scoreOf(w);
    const air = w.pressure != null ? airDensity(w.temp, w.pressure, w.humidity) : null;
    const f = conditionFactor(s.grip, s.pace, s.mood === "wet");
    out.push({
      h: hd.time[i] ? +hd.time[i].slice(11, 13) : i, temp: w.temp, feels: w.feels, cloud: w.cloud, precip: w.precip, wind: w.wind, gust: w.gust,
      dir: w.dir ?? 0, code: w.code, grip: s.grip, pace: s.pace, score: s.s10, mood: s.mood,
      lap: baseline ? baseline * f : null, rad: air ? air.relPct : null,
    });
  }
  return out;
}

export interface Highlight { icon: string; text: string; }

/** plain-language karting highlights from the day's hourly, from `nowH` onward */
export function highlights(hours: HourPt[], nowH: number): Highlight[] {
  const out: Highlight[] = [];
  if (!hours.length) return out;
  const ahead = hours.filter((p) => p.h >= nowH);
  const day = ahead.length ? ahead : hours;
  const now = hours.find((p) => p.h === nowH);

  // 1) best 2-hour grip window
  let bi = day[0].h, bv = -1;
  for (let i = 0; i < day.length - 1; i++) {
    const avg = (day[i].score + day[i + 1].score) / 2;
    if (avg > bv) { bv = avg; bi = day[i].h; }
  }
  out.push({ icon: "🏁", text: `Best grip ${pad(bi)}:00–${pad(bi + 2)}:00 — ${bv.toFixed(1)}/10` });

  // 2) rain timing
  const rainAhead = day.filter((p) => p.precip >= 0.3);
  if (!rainAhead.length) out.push({ icon: "☀️", text: "Dry the rest of the day" });
  else {
    const rainingNow = (now?.precip ?? 0) >= 0.3;
    if (rainingNow) {
      const dry = day.find((p) => p.precip < 0.3);
      out.push({ icon: "🌧️", text: dry ? `Wet now — drying around ${pad(dry.h)}:00` : "Wet all day — wet-line setup" });
    } else {
      out.push({ icon: "🌧️", text: `Dry until ${pad(rainAhead[0].h)}:00, then rain` });
    }
  }

  // 3) jetting / air density note
  const rad = now?.rad ?? null;
  if (rad != null) {
    const txt = rad > 101.2 ? `Dense air (${rad.toFixed(0)}%) — jet richer` : rad < 98.8 ? `Thin air (${rad.toFixed(0)}%) — jet leaner` : `Air density ${rad.toFixed(0)}% — near baseline`;
    out.push({ icon: "⚙️", text: txt });
  }
  return out.slice(0, 3);
}
