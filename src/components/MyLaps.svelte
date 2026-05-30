<script lang="ts">
  import { PERSONAL, PSESSIONS, personalLimit } from "../lib/personal";
  import { conditionFactor } from "../lib/laptime";
  import { fmtLap } from "../lib/laptime";

  const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const d0ms = Date.parse(PERSONAL.d0 + "T00:00");
  const days = (d: string) => Math.round((Date.parse(d + "T00:00") - d0ms) / 86400000);
  const paceFromTemp = (t: number) => clamp(1 - Math.abs(t - 12) / 28, 0, 1);

  const pts = PSESSIONS.map((s) => ({ ...s, day: days(s.d) }));
  const maxDay = Math.max(...pts.map((p) => p.day));
  const YMIN = 42, YMAX = 54;

  // chart geometry
  const W = 360, H = 150, L = 30, R = 350, T = 12, B = 122;
  const xT = (day: number) => L + (R - L) * (maxDay ? day / maxDay : 0);
  const yT = (lap: number) => T + (B - T) * (1 - (clamp(lap, YMIN, YMAX) - YMIN) / (YMAX - YMIN));
  const xG = (g: number) => L + (R - L) * g;

  // improvement line (a + b·day)
  const limLine = `M${xT(0)} ${yT(PERSONAL.a)} L${xT(maxDay)} ${yT(PERSONAL.a + PERSONAL.b * maxDay)}`;
  // conditions: normalise each lap to the *current* limit (removes the date trend)
  const norm = pts.map((p) => ({ ...p, ny: p.best * (PERSONAL.limitNow / personalLimit(p.d)) }));
  // model curve: limitNow × conditionFactor(grip)
  const curve = Array.from({ length: 41 }, (_, i) => {
    const g = i / 40;
    return `${i ? "L" : "M"}${xG(g).toFixed(1)} ${yT(PERSONAL.limitNow * conditionFactor(g, 0.46, g < 0.45)).toFixed(1)}`;
  }).join(" ");

  const improveWk = (PERSONAL.b * 7).toFixed(2);
  function color(p: any) { return p.off ? "rgba(140,140,150,.45)" : p.wet ? "rgba(120,160,220,.9)" : "rgb(var(--accent))"; }
  const dateLabels = [0, Math.round(maxDay / 2), maxDay];
  function dlabel(day: number) { return new Date(d0ms + day * 86400000).toLocaleDateString("en", { month: "short", day: "numeric" }); }
</script>

<div class="mylaps">
  <div class="ml-head">
    <span>my laps · {PERSONAL.track}</span>
    <span class="ml-sub">{PERSONAL.cls} · {PSESSIONS.length} sessions</span>
  </div>

  <div class="ml-stat">
    PB <b>{fmtLap(PERSONAL.fastest)}</b> · limit now <b>{fmtLap(PERSONAL.limitNow)}</b> ·
    improving <b>{improveWk}s/wk</b>
  </div>

  <div class="ml-cap">lap time over time — you're getting faster</div>
  <svg viewBox="0 0 {W} {H}" style="color:var(--dim)">
    {#each [42, 46, 50, 54] as g}
      <line x1={L} y1={yT(g)} x2={R} y2={yT(g)} stroke="rgba(128,128,128,.16)" />
      <text x={L - 4} y={yT(g) + 3} text-anchor="end" font-size="8" fill="currentColor">{g}</text>
    {/each}
    {#each dateLabels as d}<text x={xT(d)} y={B + 14} text-anchor="middle" font-size="8" fill="currentColor">{dlabel(d)}</text>{/each}
    <path d={limLine} stroke="rgb(var(--accent))" stroke-width="1.5" stroke-dasharray="4 3" fill="none" opacity="0.8" />
    {#each pts as p}<circle cx={xT(p.day)} cy={yT(p.best)} r="2.6" fill={color(p)} />{/each}
  </svg>
  <div class="ml-legend"><span class="lg dry">dry</span><span class="lg wet">wet</span><span class="lg off">off-day</span><span class="lg lim">limit (fit)</span></div>

  <div class="ml-cap">lap time vs grip — your laps vs GripCast's estimate</div>
  <svg viewBox="0 0 {W} {H}" style="color:var(--dim)">
    {#each [42, 46, 50, 54] as g}
      <line x1={L} y1={yT(g)} x2={R} y2={yT(g)} stroke="rgba(128,128,128,.16)" />
      <text x={L - 4} y={yT(g) + 3} text-anchor="end" font-size="8" fill="currentColor">{g}</text>
    {/each}
    {#each [0, 0.5, 1] as g}<text x={xG(g)} y={B + 14} text-anchor="middle" font-size="8" fill="currentColor">{g === 0 ? "wet" : g === 1 ? "dry" : "grip"}</text>{/each}
    <path d={curve} stroke="rgba(230,170,90,.9)" stroke-width="1.8" fill="none" />
    {#each norm as p}<circle cx={xG(p.grip)} cy={yT(p.ny)} r="2.6" fill={color(p)} />{/each}
  </svg>
  <div class="ml-legend"><span class="lg est">GripCast estimate</span><span class="lg dry">your laps (trend-adjusted)</span></div>
</div>
