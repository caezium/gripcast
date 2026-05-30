// MOCK lap-time model: turn the 0–10 conditions score into a "best theoretical
// lap" for today. baseline = the ideal/record lap (score 10, dry, cool); worse
// conditions add a percentage penalty. Rough by design — for evaluating whether
// a time reads better than an abstract /10.

import type { Mood } from "./score";

/** the kart class these baselines assume */
export const KART_CLASS = "IAME X30 Senior";

// Competitive dry X30 Senior (125cc TaG, ~30 hp) lap baselines (s) for the
// featured circuits — the fast/qualifying end, which the model treats as the
// score-10 ideal. Grounded where data exists (e.g. South Garda ~48–49s).
const BENCH: Record<string, number> = {
  "South Garda Karting": 48.5,
  "Franciacorta Karting": 51.0,
  "Adria Karting Raceway": 48.5,
  "PF International": 53.0,
  "Whilton Mill": 52.0,
  "Karting Genk": 50.5,
  "GoPro Motorplex": 49.0,
  "New Castle Motorsports": 47.5,
  "Suzuka Circuit": 50.0,
  "Bahrain Karting": 53.0,
};
/** known X30 Senior baseline, or null when we have no credible figure */
export function defaultBaseline(name: string): number | null {
  return BENCH[name] ?? null;
}

export interface Lap { sec: number; gapSec: number; gapPct: number; }
export function theoreticalLap(score: number, mood: Mood, baselineSec: number): Lap {
  // each point below 10 ≈ +0.7% lap time; wet line is disproportionately slower
  let gapPct = (10 - score) * 0.7;
  if (mood === "wet") gapPct += 4;
  gapPct = Math.max(0, gapPct);
  const sec = baselineSec * (1 + gapPct / 100);
  return { sec, gapSec: sec - baselineSec, gapPct };
}

/** seconds → "48.3" or "1:08.3" */
export function fmtLap(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return m > 0 ? m + ":" + s.toFixed(1).padStart(4, "0") : s.toFixed(1);
}
