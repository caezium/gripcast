<script lang="ts">
  import { onMount } from "svelte";
  import { reducedMotion } from "../lib/a11y";
  export let count = 4;
  export let wind = 6;
  export let color = "150,156,170";

  let layer: HTMLDivElement;
  function build() {
    if (!layer) return;
    layer.innerHTML = "";
    const W = innerWidth, H = innerHeight;
    const dur = Math.max(7, Math.min(42, 42 - wind * 1.1));
    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "cloud-blob";
      const cw = 480 + Math.random() * 440, ch = 46 + Math.random() * 64;
      b.style.width = cw + "px"; b.style.height = ch + "px";
      b.style.top = Math.random() * H * 0.92 + "px"; b.style.left = Math.random() * W - cw * 0.3 + "px";
      b.style.opacity = (0.26 + Math.random() * 0.2).toFixed(2);
      b.style.filter = `url(#cw${i % 3}) blur(${(11 + Math.random() * 5).toFixed(1)}px)`;
      const dx = 180 + Math.random() * 240, d = dur * (0.8 + Math.random() * 0.5);
      if (!reducedMotion) {
        b.animate(
          [{ transform: `translateX(${-dx}px)` }, { transform: `translateX(${dx}px)` }],
          { duration: d * 1000, direction: "alternate", iterations: Infinity, easing: "linear", delay: -Math.random() * d * 1000 }
        );
      }
      layer.appendChild(b);
    }
  }
  onMount(build);
  $: if (layer) { void count; void wind; build(); }
</script>

<div class="cloud-layer" bind:this={layer} style="--cloud:{color}"></div>
