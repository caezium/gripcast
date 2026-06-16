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

/** Rough track-surface temp: air + solar gain (clear daytime) or slightly below air at night. */
export function trackTemp(tempC: number, cloud?: number, daylight = true): number {
  if (!daylight) return tempC - 1;
  const solar = 1 - (cloud ?? 0) / 100;
  return tempC + solar * 10;
}

/** Best 2-hour window (highest average score) in the rest of the day. */
export function bestWindow(hd: Hourly | null, fromHour: number) {
  if (!hd || hd.code.length < 2) return null;
  let best = { start: fromHour, end: fromHour + 2, score: -1 };
  for (let i = 0; i < hd.code.length - 1; i++) {
    const hour = hd.time[i] ? +hd.time[i].slice(11, 13) : i;
    if (hour < fromHour) continue;
    const avg = (scoreOf(hourW(hd, i)).s10 + scoreOf(hourW(hd, i + 1)).s10) / 2;
    if (avg > best.score) best = { start: hour, end: hour + 2, score: avg };
  }
  return best.score < 0 ? null : best;
}
