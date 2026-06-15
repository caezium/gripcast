<script lang="ts">
  import ConditionsPanel from "./ConditionsPanel.svelte";
  import type { HourPt, Highlight } from "../lib/dash";
  export let hours: HourPt[] = [];
  export let nowH = 12;
  export let live = true;
  export let hl: Highlight[] = [];
  export let sun: { rise: string; set: string } | null = null;
  export let place = "";
</script>

<div class="dash">
  {#if place}<div class="dash-place">{place}</div>{/if}
  {#if hl.length}
    <div class="dash-hl">
      <div class="dh-title">Highlights</div>
      {#each hl as h}<div class="dh-row"><span class="dh-ic">{h.icon}</span><span>{h.text}</span></div>{/each}
    </div>
  {/if}
  <div class="dash-card">
    <ConditionsPanel {hours} {nowH} {live} />
  </div>
  {#if sun}<div class="dash-sun"><span>☀ {sun.rise}</span><span class="dim">sunset</span><span>{sun.set} 🌙</span></div>{/if}
</div>
