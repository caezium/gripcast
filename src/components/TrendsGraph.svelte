<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Weather } from "../lib/weather";
  import { dayW } from "../lib/weather";
  import { scoreOf } from "../lib/score";
  import { lang } from "../lib/i18n";

  export let data: Weather;
  export let selDate: string | null;
  const dispatch = createEventDispatcher();

  const W = 720, H = 232, L = 34, R = 708, T = 16, B = 168;
  let scores: number[] = [], temps: number[] = [], probs: number[] = [];
  let n = 0, line = "", area = "", tline = "", tMin = 0, tr = 1, selI = -1;

  $: {
    const days = data.daily.time; n = days.length;
    scores = days.map((_, i) => scoreOf(dayW(data, i)).s10);
    temps = days.map((_, i) => (data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2);
    probs = days.map((_, i) => data.daily.precipitation_probability_max[i] || 0);
    tMin = Math.min(...temps); const tMax = Math.max(...temps); tr = (tMax - tMin) || 1;
    line = ""; area = `M${x(0)} ${B}`; tline = "";
    scores.forEach((s, i) => { const X = x(i).toFixed(1), Y = yS(s).toFixed(1); line += (i ? "L" : "M") + X + " " + Y + " "; area += ` L${X} ${Y}`; });
    area += ` L${x(n - 1).toFixed(1)} ${B} Z`;
    temps.forEach((tv, i) => { tline += (i ? "L" : "M") + x(i).toFixed(1) + " " + yT(tv).toFixed(1) + " "; });
    selI = days.indexOf(selDate || "");
  }
  const x = (i: number) => L + (R - L) * (n <= 1 ? 0 : i / (n - 1));
  const yS = (v: number) => T + (B - T) * (1 - Math.max(0, Math.min(1, v / 10)));
  const yT = (v: number) => T + (B - T) * (1 - Math.max(0, Math.min(1, (v - tMin) / tr)));
  $: step = Math.max(1, Math.ceil(n / 8));
  $: todayX = x(data.todayIdx);
  $: confX = x(Math.min(data.todayIdx + 7, n - 1));
  $: labels = data.daily.time.map((ds, i) => ({ i, show: i % step === 0, x: x(i), txt: new Date(ds + "T00:00").toLocaleDateString($lang, { month: "short", day: "numeric" }) }));
</script>

<svg viewBox="0 0 {W} {H}" width="100%" height="auto" style="color:var(--dim)">
  {#each [0, 5, 10] as g}
    <line x1={L} y1={yS(g)} x2={R} y2={yS(g)} stroke="rgba(128,128,128,.18)" />
    <text x={L - 5} y={yS(g) + 3} text-anchor="end" font-size="9" fill="currentColor">{g}</text>
  {/each}
  {#each probs as p, i}
    {#if p > 1}<rect x={x(i) - 2} y={B + 34 - (p / 100) * 38} width="4" height={(p / 100) * 38} fill="rgba(120,160,220,.5)" />{/if}
  {/each}
  <path d={area} fill="rgba(127,176,224,.16)" />
  <path d={tline} fill="none" stroke="rgba(230,170,90,.85)" stroke-width="1.3" />
  <path d={line} fill="none" stroke="rgb(127,176,224)" stroke-width="2" />
  {#if confX < R - 2}
    <rect x={confX} y={T} width={R - confX} height={B - T} fill="rgba(128,128,128,.06)" />
    <line x1={confX} y1={T} x2={confX} y2={B} stroke="currentColor" stroke-dasharray="2 3" opacity="0.35" />
  {/if}
  <line x1={todayX} y1={T} x2={todayX} y2={B} stroke="currentColor" stroke-dasharray="3 3" opacity="0.6" />
  {#if selI >= 0}<circle cx={x(selI)} cy={yS(scores[selI])} r="4" fill="rgb(127,176,224)" stroke="#fff" stroke-width="1.5" />{/if}
  {#each labels as l}{#if l.show}<text x={l.x} y={B + 50} text-anchor="middle" font-size="8" fill="currentColor">{l.txt}</text>{/if}{/each}
  {#each scores as _, i}
    <rect x={x(i) - (R - L) / (2 * ((n - 1) || 1))} y={T} width={(R - L) / ((n - 1) || 1)} height={B - T + 40} fill="transparent" style="cursor:pointer" on:click={() => dispatch("select", i)} role="button" tabindex="-1" />
  {/each}
</svg>
