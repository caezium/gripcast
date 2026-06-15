<script lang="ts">
  import type { HourPt } from "../lib/dash";
  import { fmt } from "../lib/units";
  import { pad } from "../lib/util";

  export let hours: HourPt[] = [];
  export let nowH = 12;
  export let live = true;

  let view: "sky" | "precip" | "wind" | "grip" = "sky";
  const VIEWS = [
    { k: "sky", ic: "☁", lab: "sky" },
    { k: "precip", ic: "💧", lab: "rain" },
    { k: "wind", ic: "🌬", lab: "wind" },
    { k: "grip", ic: "🏁", lab: "grip" },
  ] as const;

  // geometry
  const W = 600, H = 196, L = 34, R = 590, T = 18, B = 150;
  $: n = hours.length || 1;
  const xh = (h: number) => L + (R - L) * (n > 1 ? h / (n - 1) : 0);
  const yv = (v: number, mn: number, mx: number) => B - (B - T) * ((v - mn) / (mx - mn || 1));
  $: nowX = xh(Math.min(nowH, n - 1));

  function path(vals: number[], mn: number, mx: number) {
    return vals.map((v, i) => `${i ? "L" : "M"}${xh(i).toFixed(1)} ${yv(v, mn, mx).toFixed(1)}`).join(" ");
  }
  function area(vals: number[], mn: number, mx: number) {
    return `M${xh(0).toFixed(1)} ${B} ` + vals.map((v, i) => `L${xh(i).toFixed(1)} ${yv(v, mn, mx).toFixed(1)}`).join(" ") + ` L${xh(n - 1).toFixed(1)} ${B} Z`;
  }
  const hourLabels = [0, 6, 12, 18, 23];

  // series
  $: temps = hours.map((p) => p.temp);
  $: tMin = temps.length ? Math.min(...temps) : 0;
  $: tMax = temps.length ? Math.max(...temps) : 1;
  $: clouds = hours.map((p) => p.cloud);
  $: precs = hours.map((p) => p.precip);
  $: pMax = Math.max(0.6, ...precs);
  $: winds = hours.map((p) => p.wind);
  $: gusts = hours.map((p) => p.gust);
  $: wMax = Math.max(10, ...gusts);
  $: scores = hours.map((p) => p.score);
  $: laps = hours.map((p) => p.lap ?? 0);
  $: lMin = Math.min(...laps.filter((x) => x > 0), 999);
  $: lMax = laps.length ? Math.max(...laps) : 0;
  $: cur = hours[Math.min(nowH, n - 1)];

  function pcol(mm: number) { return mm >= 4 ? "rgba(90,130,200,.9)" : mm >= 1 ? "rgba(110,150,210,.78)" : "rgba(140,175,225,.6)"; }
  function gcol(s: number) { return s >= 7.5 ? "#46dc96" : s >= 6 ? "#7ac8a0" : s >= 4.5 ? "#e8b14a" : "#e8895a"; }
  const windArrows = [2, 6, 10, 14, 18, 22];
</script>

<div class="cpanel">
  <div class="cseg">
    {#each VIEWS as v}
      <button class:active={view === v.k} on:click={() => (view = v.k)}><span class="ci">{v.ic}</span> {v.lab}</button>
    {/each}
  </div>

  <div class="chead">
    {#if view === "sky"}<span>now <b>{$fmt.temp(cur?.temp)}</b></span><span class="cm">cloud <b>{Math.round(cur?.cloud ?? 0)}%</b></span>
    {:else if view === "precip"}<span>now <b>{(cur?.precip ?? 0).toFixed(1)} mm</b></span><span class="cm">{precs.some((p) => p >= 0.3) ? "rain in the day" : "dry"}</span>
    {:else if view === "wind"}<span>wind <b>{$fmt.speed(cur?.wind)}</b></span><span class="cm">gust <b>{$fmt.speed(cur?.gust)}</b></span>
    {:else}<span>grip <b>{(cur?.score ?? 0).toFixed(1)}/10</b></span><span class="cm">{cur?.lap ? "≈ lap " + cur.lap.toFixed(1) + "s" : ""}</span>{/if}
  </div>

  <svg viewBox="0 0 {W} {H}" style="color:var(--dim)">
    <!-- now marker -->
    {#if live}<line x1={nowX} y1={T} x2={nowX} y2={B} stroke="currentColor" stroke-dasharray="2 3" opacity=".4" />{/if}
    {#each hourLabels as h}<text x={xh(h)} y={H - 4} text-anchor="middle" font-size="9" fill="currentColor">{pad(h)}</text>{/each}

    {#if view === "sky"}
      <path d={area(clouds, 0, 100)} fill="rgba(170,180,195,.14)" />
      <path d={path(temps, tMin - 1, tMax + 1)} fill="none" stroke="rgb(var(--accent))" stroke-width="2" />
      {#each [tMin, tMax] as tv}<text x={L - 4} y={yv(tv, tMin - 1, tMax + 1) + 3} text-anchor="end" font-size="9" fill="currentColor">{$fmt.temp(tv)}</text>{/each}
    {:else if view === "precip"}
      {#each precs as p, i}{#if p > 0.02}<rect x={xh(i) - 4} y={yv((p / pMax) * pMax, 0, pMax)} width="8" height={B - yv(p, 0, pMax)} rx="2" fill={pcol(p)} />{/if}{/each}
      <text x={L - 4} y={yv(pMax, 0, pMax) + 3} text-anchor="end" font-size="9" fill="currentColor">{pMax.toFixed(1)}</text>
      <text x={L - 4} y={B} text-anchor="end" font-size="9" fill="currentColor">0</text>
    {:else if view === "wind"}
      <path d={area(winds, 0, wMax)} fill="rgba(127,176,224,.16)" />
      <path d={path(winds, 0, wMax)} fill="none" stroke="rgb(var(--accent))" stroke-width="2" />
      <path d={path(gusts, 0, wMax)} fill="none" stroke="rgba(127,176,224,.5)" stroke-width="1.2" stroke-dasharray="3 3" />
      {#each windArrows as h}{#if hours[h]}<g transform="translate({xh(h)},{T + 4}) rotate({(hours[h].dir + 180) % 360})"><text font-size="11" text-anchor="middle" fill="currentColor">↑</text></g>{/if}{/each}
    {:else}
      <path d={area(scores, 0, 10)} fill="rgba(70,220,150,.1)" />
      <path d={path(scores, 0, 10)} fill="none" stroke="#46dc96" stroke-width="2" />
      {#if lMax > 0}<path d={path(laps.map((l) => (l > 0 ? l : lMin)), lMin - 0.5, lMax + 0.5)} fill="none" stroke="rgba(230,170,90,.7)" stroke-width="1.3" stroke-dasharray="2 2" />{/if}
      {#each [0, 5, 10] as g}<text x={L - 4} y={yv(g, 0, 10) + 3} text-anchor="end" font-size="9" fill="currentColor">{g}</text>{/each}
      {#each hours as p, i}{#if i % 3 === 0}<circle cx={xh(i)} cy={yv(p.score, 0, 10)} r="2" fill={gcol(p.score)} />{/if}{/each}
    {/if}
  </svg>

  {#if view === "grip"}<div class="cleg"><span class="lg g">grip /10</span><span class="lg l">predicted lap</span></div>{/if}
  {#if view === "wind"}<div class="cleg"><span class="lg w">wind</span><span class="lg gu">gust</span><span class="lg ar">↑ blowing toward</span></div>{/if}
</div>
