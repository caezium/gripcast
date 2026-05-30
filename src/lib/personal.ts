// Personal calibration for Shenzhen Xtreme Speedway, derived offline from the
// user's AiM .xrk telemetry (lap times) paired with ERA5 historical weather.
// 33 real multi-lap sessions, 2026-03-30 → 2026-05-11. Driver: IAME X30 Senior.
// Dry "personal limit" fitted as a robust lower-envelope line (off-days dropped);
// wet sessions validated the physics grip→time step (~+10% in real rain).

export interface PSession { d: string; best: number; n: number; grip: number; score: number; wet: number; off: number; temp: number; }

export const PERSONAL = {
  track: 'Shenzhen Xtreme Speedway',
  cls: 'IAME X30 Senior',
  lat: 22.7117, lon: 113.8654,
  d0: '2026-03-30',
  a: 44.993, b: -0.04838,          // dry limit (s) = a + b·(days since d0)
  limitNow: 42.96,          // fitted current dry potential
  fastest: 42.473,            // personal best clean lap
  cornerFrac: 0.62,
};

export const PSESSIONS: PSession[] = [
  {d:'2026-03-31',best:44.99,n:9,grip:1,score:6.4,wet:0,off:0,temp:27.5},
  {d:'2026-03-31',best:44.51,n:13,grip:1,score:6.4,wet:0,off:0,temp:27.5},
  {d:'2026-03-31',best:44.46,n:11,grip:1,score:6.3,wet:0,off:0,temp:28.0},
  {d:'2026-04-03',best:49.84,n:12,grip:0.427,score:2.4,wet:1,off:0,temp:27.1},
  {d:'2026-04-03',best:49.62,n:15,grip:1,score:6.3,wet:0,off:1,temp:28.0},
  {d:'2026-04-03',best:50.15,n:9,grip:0.575,score:3.3,wet:0,off:1,temp:27.9},
  {d:'2026-04-03',best:44.94,n:12,grip:0.378,score:2.1,wet:1,off:0,temp:26.6},
  {d:'2026-04-15',best:46.56,n:14,grip:1,score:6.2,wet:0,off:1,temp:29.5},
  {d:'2026-04-16',best:44.91,n:8,grip:0.575,score:3.4,wet:0,off:0,temp:28.6},
  {d:'2026-04-16',best:45.28,n:10,grip:0.575,score:3.2,wet:0,off:0,temp:28.6},
  {d:'2026-04-19',best:45.7,n:13,grip:0.402,score:2.7,wet:1,off:0,temp:30.4},
  {d:'2026-04-24',best:48.51,n:17,grip:0,score:1.2,wet:1,off:0,temp:19.0},
  {d:'2026-04-24',best:47.73,n:12,grip:0,score:1.0,wet:1,off:0,temp:18.8},
  {d:'2026-04-24',best:48.53,n:15,grip:0,score:1.1,wet:1,off:0,temp:18.7},
  {d:'2026-04-24',best:53.34,n:7,grip:0,score:1.1,wet:1,off:0,temp:18.3},
  {d:'2026-04-27',best:42.92,n:15,grip:0.575,score:4.4,wet:0,off:0,temp:27.4},
  {d:'2026-04-28',best:44.82,n:13,grip:0.575,score:4.0,wet:0,off:0,temp:26.4},
  {d:'2026-04-28',best:44.63,n:7,grip:0.575,score:4.0,wet:0,off:0,temp:26.4},
  {d:'2026-05-02',best:43.31,n:13,grip:1,score:6.6,wet:0,off:0,temp:28.5},
  {d:'2026-05-02',best:43.85,n:17,grip:1,score:6.6,wet:0,off:0,temp:28.5},
  {d:'2026-05-02',best:44.15,n:11,grip:1,score:6.6,wet:0,off:0,temp:28.2},
  {d:'2026-05-03',best:52.08,n:15,grip:0.415,score:3.4,wet:1,off:0,temp:24.4},
  {d:'2026-05-05',best:48.67,n:6,grip:0.402,score:3.9,wet:1,off:0,temp:20.3},
  {d:'2026-05-05',best:51.42,n:19,grip:0.575,score:4.8,wet:0,off:1,temp:21.8},
  {d:'2026-05-05',best:49.59,n:16,grip:1,score:7.9,wet:0,off:1,temp:25.3},
  {d:'2026-05-05',best:48.85,n:14,grip:1,score:7.5,wet:0,off:1,temp:27.3},
  {d:'2026-05-05',best:52.13,n:13,grip:0.575,score:4.4,wet:0,off:1,temp:25.9},
  {d:'2026-05-09',best:42.47,n:15,grip:1,score:7.5,wet:0,off:0,temp:25.7},
  {d:'2026-05-09',best:43.75,n:7,grip:1,score:7.7,wet:0,off:0,temp:25.8},
  {d:'2026-05-09',best:43.33,n:15,grip:1,score:7.7,wet:0,off:0,temp:26.0},
  {d:'2026-05-11',best:43.06,n:10,grip:1,score:6.9,wet:0,off:0,temp:28.5},
  {d:'2026-05-11',best:43.12,n:9,grip:1,score:7.1,wet:0,off:0,temp:28.8},
  {d:'2026-05-11',best:43.46,n:6,grip:1,score:7.1,wet:0,off:0,temp:28.8}
];

const DAY = 86400000;
function daysSince(dateISO: string): number {
  return Math.round((Date.parse(dateISO + "T00:00") - Date.parse(PERSONAL.d0 + "T00:00")) / DAY);
}
/** is this place the Shenzhen track the personal data covers? (~2.5 km) */
export function isPersonalTrack(lat: number, lon: number): boolean {
  return Math.abs(lat - PERSONAL.lat) < 0.025 && Math.abs(lon - PERSONAL.lon) < 0.025;
}
/** fitted dry potential (s) on a given date — clamped not far past the PB */
export function personalLimit(dateISO: string): number {
  const v = PERSONAL.a + PERSONAL.b * daysSince(dateISO);
  return Math.max(v, PERSONAL.fastest - 1.0);
}
