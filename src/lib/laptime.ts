// MOCK lap-time model: turn the 0–10 conditions score into a "best theoretical
// lap" for today. baseline = the ideal/record lap (score 10, dry, cool); worse
// conditions add a percentage penalty. Rough by design — for evaluating whether
// a time reads better than an abstract /10.

import type { Mood } from "./score";

/** approximate kart benchmark laps (s) for the featured circuits — mock seeds */
const BENCH: Record<string, number> = {
  "South Garda Karting": 47.5, "Franciacorta Karting": 50.0, "Adria Karting Raceway": 44.0,
  "PF International": 49.0, "Whilton Mill": 47.0, "Karting Genk": 48.0,
  "GoPro Motorplex": 44.0, "New Castle Motorsports": 43.0, "Suzuka Circuit": 62.0, "Bahrain Karting": 50.0,
};
export function defaultBaseline(name: string): number {
  return BENCH[name] ?? 50.0;
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
