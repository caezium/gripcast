// Kart tyre cold-pressure model, ported from the racemaxsport-derived notebook.
// Multiplicative coefficient model with continuous (interpolated) inputs:
//   P_bar = base(compound) × f(asphalt age) × f(rubber %) × f(air temp)

export const BAR_TO_PSI = 14.503773773; // exact bar→psi (100000 Pa / (lb·g/in²))

const MODEL_MAP: Record<string, Record<string, number>> = {
  Mojo: { C2: 0.71, D2: 0.65, D5: 0.55 },
  LeCont: { "SVA Mini": 0.70, "LOH Option": 0.57, "LPM Prime": 0.51 },
  Vega: { "M1 Mini": 0.68, XH4: 0.57, XM4: 0.51 },
  MG: { SM2: 0.65, SH2: 0.90 },
};

export interface Compound { key: string; brand: string; model: string; label: string; }
export const COMPOUNDS: Compound[] = Object.entries(MODEL_MAP).flatMap(([brand, models]) =>
  Object.keys(models).map((model) => ({ key: `${brand}|${model}`, brand, model, label: `${brand} ${model}` }))
);
export const COMPOUND_MAP: Record<string, Compound> = Object.fromEntries(COMPOUNDS.map((c) => [c.key, c]));

// bucket midpoints → multiplier (calibration points, linearly interpolated)
const TEMP_CURVE: [number, number][] = [[2.5, 1.15], [7.5, 1.04], [14.5, 1.02], [22, 0.99], [28, 0.97], [35, 0.84]];
const ASPHALT_CURVE: [number, number][] = [[1, 1.01], [4, 0.98], [8, 0.95], [13, 0.94]]; // x = asphalt age (yr)
const GRIP_CURVE: [number, number][] = [[0, 1.08], [33, 1.05], [66, 1.0], [100, 0.97]]; // x = rubber % (0 green → 100 rubbered)

function interp(x: number, pts: [number, number][]): number {
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1][1];
}

/** recommended minimum cold pressure for a compound at given conditions */
export function coldPressure(brand: string, model: string, airTempC: number, asphaltYears = 8, gripPct = 50) {
  const base = MODEL_MAP[brand]?.[model];
  if (base == null) return null;
  const bar = base * interp(asphaltYears, ASPHALT_CURVE) * interp(gripPct, GRIP_CURVE) * interp(airTempC, TEMP_CURVE);
  return { bar, psi: bar * BAR_TO_PSI };
}
