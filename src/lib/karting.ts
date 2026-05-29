import { scoreOf, type W } from "./score";
import { hourW, type Hourly } from "./weather";

/** Moist-air density from temp (°C), station pressure (hPa), humidity (%). */
export function airDensity(tempC: number, pressureHpa?: number, humidity?: number) {
  if (pressureHpa == null) return null;
  const T = tempC + 273.15;
  const Psat = 6.1078 * Math.pow(10, (7.5 * tempC) / (tempC + 237.3)); // sat. vapour pressure, hPa (Tetens)
  const Pv = ((humidity ?? 50) / 100) * Psat;
  const Pd = pressureHpa - Pv;
  const rho = (Pd * 100) / (287.058 * T) + (Pv * 100) / (461.495 * T);
  const rho0 = 1.225; // ISA sea level
  const relPct = (rho / rho0) * 100;
  const da = 44330 * (1 - Math.pow(Math.max(0.01, rho / rho0), 1 / 4.256)); // approx density altitude (m)
  return { rho, relPct, da };
}

/** 2-stroke jetting direction: denser air (more O2) -> richer; thinner -> leaner. */
export function jetting(relPct: number): { dir: "richen" | "lean" | "baseline"; d: number } {
  const d = relPct - 100;
  if (Math.abs(d) < 1.2) return { dir: "baseline", d };
  return { dir: d > 0 ? "richen" : "lean", d };
}

/** Rough track-surface temp: air + solar gain (clear daytime) or slightly below air at night. */
export function trackTemp(tempC: number, cloud?: number, daylight = true): number {
  if (!daylight) return tempC - 1;
  const solar = 1 - (cloud ?? 0) / 100;
  return tempC + solar * 10;
}

/** Cold-set tyre-pressure nudge from track temp: cold -> raise, hot -> drop. */
export function tyreArrow(trackTempC: number): "↑" | "—" | "↓" {
  if (trackTempC < 15) return "↑";
  if (trackTempC > 38) return "↓";
  return "—";
}

/** Best 2-hour window (highest average score) in the rest of the day. */
export function bestWindow(hd: Hourly | null, fromHour: number) {
  if (!hd || hd.code.length < 2) return null;
  let best = { start: fromHour, end: fromHour + 2, score: -1 };
  for (let h = Math.max(0, fromHour); h < hd.code.length - 1; h++) {
    const avg = (scoreOf(hourW(hd, h)).s10 + scoreOf(hourW(hd, h + 1)).s10) / 2;
    if (avg > best.score) best = { start: h, end: h + 2, score: avg };
  }
  return best.score < 0 ? null : best;
}
