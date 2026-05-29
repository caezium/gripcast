<script lang="ts">
  import type { Hourly } from "../lib/weather";
  import { t as trStore } from "../lib/i18n";
  import { pad } from "../lib/util";

  export let hd: Hourly | null = null;
  export let fromHour = 0;
  export let live = true;
  $: tr = $trStore;

  let hours: { h: number; mm: number }[] = [];
  $: hours = hd ? hd.precip.map((mm, h) => ({ h, mm: mm || 0 })) : [];
  $: maxMm = Math.max(0.6, ...hours.map((x) => x.mm));
  $: start = live ? fromHour : 0;
  $: showBars = hours.some((x) => x.mm >= 0.1);

  function summarize(hrs: { h: number; mm: number }[], st: number) {
    if (!hrs || !hrs.length) return null;
    const rainAhead = hrs.filter((x) => x.h >= st && x.mm >= 0.1);
    if (!rainAhead.length) return null; // fully dry from here on — stay quiet
    const rainingNow = (hrs[st]?.mm || 0) >= 0.1;
    if (rainingNow) {
      let dry = -1;
      for (let h = st; h < 24; h++) if ((hrs[h]?.mm || 0) < 0.1) { dry = h; break; }
      return dry < 0 ? { key: "rainAllDay" } : { key: "rainUntil", time: pad(dry) + ":00" };
    }
    return { key: "dryUntil", time: pad(rainAhead[0].h) + ":00" };
  }
  $: msg = summarize(hours, start);
  function cls(mm: number) { return mm < 0.1 ? "dry" : ""; }
  function col(mm: number) { return mm >= 4 ? "rgba(90,130,200,.85)" : mm >= 1 ? "rgba(110,150,210,.7)" : "rgba(140,175,225,.55)"; }
</script>

{#if hd && (showBars || msg)}
  <div class="raintl-wrap">
    {#if showBars}
      <div class="raintl show">
        {#each hours as x}
          <div class="rb {cls(x.mm)}" style="height:{Math.max(2, (x.mm / maxMm) * 28)}px;{x.mm >= 0.1 ? `background:${col(x.mm)}` : ''}" title="{pad(x.h)}:00 · {x.mm.toFixed(1)}mm"></div>
        {/each}
      </div>
    {/if}
    {#if msg}<div class="raintl-lab">{msg.time ? tr(msg.key) + " " + msg.time : tr(msg.key)}</div>{/if}
  </div>
{/if}
