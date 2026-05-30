// Per-engine 2-stroke needle model, ported from JetLab.
// H/L needle turns = base + sensitivity × (RAD − 100) + track adjustment.
// RAD (relative air density %) comes from the shared airDensity() core.

export interface Engine {
  key: string; name: string; carbs: string[];
  H_base: number; H_k: number; L_base: number; L_k: number;
  popoff: [number, number]; popoffPerRAD: number;
  egt: [number, number]; plug: string; gap: number; water: number;
}

export const ENGINES: Engine[] = [
  { key: "x30jr", name: "IAME X30 Junior", carbs: ["Tillotson HW-27", "Tryton HB-27"], H_base: 1.25, H_k: 0.022, L_base: 1.50, L_k: 0.010, popoff: [0.70, 0.55], popoffPerRAD: 0.004, egt: [635, 593], plug: "R6252K-105", gap: 0.75, water: 52 },
  { key: "x30sr", name: "IAME X30 Senior", carbs: ["Tillotson HW-27", "Tryton HB-27"], H_base: 1.30, H_k: 0.024, L_base: 1.55, L_k: 0.011, popoff: [0.75, 0.58], popoffPerRAD: 0.004, egt: [650, 605], plug: "R6254E-105", gap: 0.65, water: 50 },
  { key: "ka100", name: "IAME KA100", carbs: ["Tillotson HL-334", "Tillotson HW-33"], H_base: 1.10, H_k: 0.020, L_base: 1.40, L_k: 0.009, popoff: [0.62, 0.48], popoffPerRAD: 0.0035, egt: [640, 600], plug: "R6254E-105", gap: 0.60, water: 48 },
  { key: "mini", name: "IAME Mini Swift", carbs: ["Tillotson HW-27A"], H_base: 1.20, H_k: 0.021, L_base: 1.45, L_k: 0.010, popoff: [0.68, 0.52], popoffPerRAD: 0.004, egt: [625, 588], plug: "R6252K-105", gap: 0.70, water: 50 },
];
export const ENGINE_MAP: Record<string, Engine> = Object.fromEntries(ENGINES.map((e) => [e.key, e]));

const RAD_REF = 100;
/** track: 0 technical · 0.5 medium · 1 long straights */
export function jet(eng: Engine, rad: number, track = 0.5) {
  const d = rad - RAD_REF, ta = (track - 0.5) * 0.06;
  return {
    H: eng.H_base + eng.H_k * d + ta,
    L: eng.L_base + eng.L_k * d,
    popOpen: eng.popoff[0] + eng.popoffPerRAD * d,
    popClose: eng.popoff[1] + eng.popoffPerRAD * d,
  };
}

const EIGHTHS = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];
/** turns → "1¼" (categorical, never 1.1873 — Dark Sky principle) */
export function turnsStr(t: number): string {
  const w = Math.floor(t), f = Math.round((t - w) * 8);
  if (f === 8) return String(w + 1);
  if (f === 0) return String(w);
  return w + EIGHTHS[f];
}
/** recommended vs baseline → "¼ leaner" / "⅛ richer" / "on point" */
export function vsBaseline(rec: number, ref: number): string {
  const e = Math.round((ref - rec) * 8);
  if (e === 0) return "on point";
  const mag = Math.abs(e), whole = Math.floor(mag / 8), rem = mag % 8;
  let m = (whole ? whole + (rem ? " " : "") : "") + (rem ? EIGHTHS[rem] : whole ? "" : EIGHTHS[mag] || mag + "/8");
  if (mag >= 8 && rem === 0) m = String(whole);
  return m + (e > 0 ? " leaner" : " richer");
}
