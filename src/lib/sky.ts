import { clamp } from "./util";

export type Phase = "night" | "dawn" | "day" | "golden" | "dusk";

const SKIES: Record<Phase, { stops: string[]; light: boolean }> = {
  night:  { stops: ["#0c0f1c","#141a30","#1a2138","#10131f"], light: false },
  dawn:   { stops: ["#27314f","#5b5a7e","#b5859b","#e9b48f"], light: false },
  day:    { stops: ["#4878a0","#7ac0d8","#b8e0ea","#e8f6fa"], light: true },
  golden: { stops: ["#2b3a66","#7a6a8e","#d98f63","#ffce93"], light: false },
  dusk:   { stops: ["#161d3a","#42375f","#a35d6e","#e0936f"], light: false },
};
const GREY: Record<Phase, string[]> = {
  night: ["#10121a","#181a24","#1d2028","#121319"], dawn: ["#3a3f4c","#6a6d76","#9a9ba2","#c6c7cb"],
  day: ["#6c7783","#97a2ac","#bcc3c9","#dfe3e6"], golden: ["#3a3d49","#6e6a72","#9a8e86","#c4b8ad"], dusk: ["#1c1e28","#3c3a44","#6a6068","#928a86"],
};

function hexMix(a: string, b: string, tt: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.substr(i, 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.substr(i, 2), 16));
  return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * tt).toString(16).padStart(2, "0")).join("");
}

export function phaseAt(localMin: number, sr: number | null, ss: number | null): Phase {
  if (sr == null || ss == null) return localMin < 360 || localMin > 1200 ? "night" : "day";
  if (localMin < sr - 55 || localMin > ss + 60) return "night";
  if (localMin < sr + 50) return "dawn";
  if (localMin > ss + 12) return "dusk";
  if (localMin > ss - 55) return "golden";
  return "day";
}

export interface SkyOut { stops: string[]; lightSky: boolean; cloudColor: string; cloudCount: number; fxMode: "rain" | "stars" | "none"; phase: Phase; }

export function computeSky(o: { phase: Phase; cloud?: number; precip?: number; wind?: number; temp?: number }): SkyOut {
  const { phase, cloud = 0, precip = 0, wind = 0, temp = 15 } = o;
  const base = SKIES[phase], grey = GREY[phase];
  const ct = clamp(cloud / 100, 0, 1) * 0.8 + (precip > 0.2 ? 0.2 : 0);
  const stops = base.stops.map((s, i) => hexMix(s, grey[i], clamp(ct, 0, 1)));
  const warm = clamp((temp - 20) / 18, 0, 1) * (1 - ct * 0.5);
  const cool = clamp((6 - temp) / 16, 0, 1) * (1 - ct * 0.5);
  if (warm > 0.02) { stops[2] = hexMix(stops[2], "#ffce82", warm * 0.5); stops[3] = hexMix(stops[3], "#ffd27a", warm * 0.62); stops[1] = hexMix(stops[1], "#ffc878", warm * 0.25); }
  if (cool > 0.02) { stops[0] = hexMix(stops[0], "#a8c6ff", cool * 0.4); stops[1] = hexMix(stops[1], "#bcd2ff", cool * 0.3); }
  const lightSky = base.light && ct < 0.6;
  return {
    stops, lightSky, phase,
    cloudColor: lightSky ? "235,238,242" : "150,156,170",
    cloudCount: Math.round(2 + (cloud / 100) * 7),
    fxMode: precip > 0.05 ? "rain" : (!base.light || ct >= 0.6 ? "stars" : "none"),
  };
}
