<script lang="ts">
  import { onMount } from "svelte";
  export let mode: "rain" | "stars" | "none" = "none";
  export let precip = 0;
  export let wind = 0;
  export let dark = true;

  let canvas: HTMLCanvasElement;
  let raf = 0, w = 0, h = 0, dpr = 1;
  let items: any[] = [];

  function resize() {
    dpr = devicePixelRatio || 1;
    w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    seed();
  }
  function mkDrop() {
    const slant = Math.max(0, Math.min(1.4, (wind || 0) / 35));
    return { x: Math.random() * w * 1.2 - w * 0.1, y: Math.random() * h, len: (16 + Math.random() * 22) * dpr, sp: (11 + Math.random() * 9 + (precip || 0)) * dpr, slant };
  }
  function seed() {
    if (mode === "stars") items = Array.from({ length: Math.min(90, Math.floor(innerWidth / 16)) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.85, r: (Math.random() * 1.5 + 0.3) * dpr, a: Math.random() * 0.6 + 0.2, tw: Math.random() * 7 }));
    else if (mode === "rain") { const dens = Math.min(520, Math.floor((precip || 1) * 120 + 140)); items = Array.from({ length: dens }, () => mkDrop()); }
    else items = [];
  }
  function frame() {
    const x = canvas.getContext("2d")!; x.clearRect(0, 0, w, h);
    if (mode === "stars") {
      for (const s of items) { s.tw += 0.03; const a = s.a * (0.55 + 0.45 * Math.sin(s.tw)); x.beginPath(); x.arc(s.x, s.y, s.r, 0, 7); x.fillStyle = `rgba(255,255,255,${a})`; x.fill(); }
    } else if (mode === "rain") {
      x.strokeStyle = dark ? "rgba(190,208,238,.6)" : "rgba(90,120,160,.5)"; x.lineWidth = 1.7 * dpr; x.lineCap = "round";
      for (const d of items) { x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x + d.slant * d.len, d.y + d.len); x.stroke(); d.y += d.sp; d.x += d.slant * d.sp * 0.5; if (d.y > h) { d.y = -d.len; d.x = Math.random() * w * 1.2 - w * 0.1; } }
    }
    raf = requestAnimationFrame(frame);
  }
  onMount(() => { resize(); addEventListener("resize", resize); frame(); return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); }; });
  $: if (canvas) { void mode; void precip; void wind; seed(); }
</script>

<canvas id="fx" bind:this={canvas}></canvas>
