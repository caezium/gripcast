// MOCK lap-time model: turn the 0–10 conditions score into a "best theoretical
// lap" for today. baseline = the ideal/record lap (score 10, dry, cool); worse
// conditions add a percentage penalty. Rough by design — for evaluating whether
// a time reads better than an abstract /10.

import type { Mood } from "./score";
import { clamp } from "./util";

/** the kart class these baselines assume */
export const KART_CLASS = "IAME X30 Senior";

/** X30 Senior average lap speed (m/s) ≈ 88 km/h — for length-derived baselines */
export const AVG_MS = 24.5;
/** estimate an X30 Senior baseline lap from circuit length (m) */
export function lengthBaseline(meters: number): number {
  return meters / AVG_MS;
}

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

/**
 * Physics-grounded conditions → lap time.
 *
 * Corner speed scales with √grip (v = √(µ·g·R)), so cornering time ∝ 1/√µ.
 * A lap is part cornering (grip-limited) and part straight (power-limited),
 * so we weight by a cornering fraction. Wet is a discrete step (you fit rain
 * tyres → ~20% less effective grip), not a smooth slide off the dry curve.
 *
 * The grip/pace sub-scores (0..1) are mapped to bounded µ / power ratios so a
 * collapsed wet grip-score doesn't imply a physically absurd 2× lap time.
 * The exact coefficients still want calibration from logged laps — this is the
 * honest physics shape, not a fitted truth.
 */
export function theoreticalLap(
  s: { grip: number; pace: number; mood: Mood },
  baselineSec: number,
  cornerFrac = 0.62
): Lap {
  const gripRatio = s.mood === "wet" ? 0.8 : 0.86 + 0.14 * clamp(s.grip); // µ / µ_ideal
  const powerRatio = 0.9 + 0.1 * clamp(s.pace); // straight-line performance
  const factor = cornerFrac * Math.pow(1 / gripRatio, 0.5) + (1 - cornerFrac) * Math.pow(1 / powerRatio, 0.5);
  const sec = baselineSec * factor;
  return { sec, gapSec: sec - baselineSec, gapPct: (factor - 1) * 100 };
}

/** seconds → "48.3" or "1:08.3" */
export function fmtLap(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return m > 0 ? m + ":" + s.toFixed(1).padStart(4, "0") : s.toFixed(1);
}
