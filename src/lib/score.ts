import { clamp } from "./util";

export interface W {
  temp: number; feels: number; wind: number; gust: number; precip: number;
  code: number; cloud: number; humidity?: number; pressure?: number; dir?: number;
}

/** WMO weather code -> [label, wetness 0..1] */
export function decode(code: number): [string, number] {
  const m: Record<number, [string, number]> = {
    0:["clear",0],1:["mostly clear",0],2:["partly cloudy",0],3:["overcast",0],45:["fog",.2],48:["rime fog",.2],
    51:["light drizzle",.5],53:["drizzle",.6],55:["heavy drizzle",.75],56:["freezing drizzle",.9],57:["freezing drizzle",.95],
    61:["light rain",.7],63:["rain",.85],65:["heavy rain",1],66:["freezing rain",.95],67:["freezing rain",1],
    71:["light snow",.9],73:["snow",.95],75:["heavy snow",1],77:["snow grains",.85],80:["light showers",.7],81:["showers",.85],
    82:["violent showers",1],85:["snow showers",.95],86:["snow showers",1],95:["thunderstorm",1],96:["thunderstorm",1],99:["thunderstorm",1],
  };
  return m[code] || ["unknown", .3];
}

export type Mood = "hot" | "good" | "mid" | "low" | "wet";
export interface Score { s10: number; grip: number; pace: number; comfort: number; label: string; mood: Mood; tagKey: string; whyKey: string; }

export function scoreOf(w: W, forceWet?: "wet" | "dry"): Score {
  const [code, realWet] = decode(w.code);
  const wet = forceWet === "wet" ? 0.9 : forceWet === "dry" ? 0 : realWet;
  let grip = 1 - wet * 0.85;
  if (forceWet !== "dry" && w.precip > 0.1) grip -= Math.min(w.precip / 8, 0.3);
  if (w.temp < 5) grip -= (5 - w.temp) * 0.03;
  if (w.temp > 32) grip -= (w.temp - 32) * 0.02;
  grip = clamp(grip);
  let pace: number;
  if (wet > 0.4) pace = 0.35 * (1 - wet) + 0.15;
  else pace = 1 - Math.abs(w.temp - 12) / 28;
  pace -= Math.min(Math.max((w.gust || w.wind) - 25, 0) / 60, 0.25);
  pace = clamp(pace);
  let comfort = 1 - Math.abs((w.feels ?? w.temp) - 21) / 26 - wet * 0.6 - Math.min(w.wind / 70, 0.3);
  comfort = clamp(comfort);
  const raw = clamp(grip * 0.5 + pace * 0.28 + comfort * 0.22);
  const s10 = Math.round(raw * 100) / 10;
  const v = verdict(s10, wet);
  return { s10, grip, pace, comfort, label: code, mood: v.mood, tagKey: v.tagKey, whyKey: limiting(w, wet, s10) };
}

export function verdict(s: number, wet: number): { tagKey: string; mood: Mood } {
  if (wet >= 0.5) return s >= 4 ? { tagKey: "wet", mood: "wet" } : { tagKey: "fullwet", mood: "wet" };
  if (s >= 9) return { tagKey: "send", mood: "hot" };
  if (s >= 7.5) return { tagKey: "grip", mood: "good" };
  if (s >= 6) return { tagKey: "good", mood: "good" };
  if (s >= 4.5) return { tagKey: "ok", mood: "mid" };
  if (s >= 3) return { tagKey: "patchy", mood: "low" };
  return { tagKey: "tough", mood: "low" };
}

/** the dominant factor holding the score back (or lifting it) — for context emphasis */
function limiting(w: W, wet: number, s: number): string {
  if (wet >= 0.5) return "wet";
  if (w.temp < 7) return "cold";
  if (w.temp > 30) return "hot";
  if ((w.gust || w.wind) > 35) return "windy";
  if (s >= 7.5) return "ideal";
  return "fine";
}
