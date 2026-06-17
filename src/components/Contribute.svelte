<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { app } from "../lib/stores";
  import { parseXrk, type XrkParse } from "../lib/xrk";
  import { shareData, uploadContribution, CONTRIBUTE_URL, type ContribMeta } from "../lib/contribute";
  import { fmtLap } from "../lib/laptime";

  export let open = false;
  const dispatch = createEventDispatcher();

  const CLASSES = [
    "IAME X30 Senior", "IAME X30 Junior", "Rotax Senior", "Rotax Junior", "Rotax DD2",
    "KA100", "OK", "OK-Junior", "Briggs LO206", "Other",
  ];

  let fileInput: HTMLInputElement;
  let file: File | null = null;
  let parsed: XrkParse | null = null;
  let pasteVal = "";
  let klass = localStorage.getItem("gc_class") || CLASSES[0];
  let handle = localStorage.getItem("gc_handle") || "";
  let status: "idle" | "parsing" | "ready" | "sending" | "done" | "local" | "error" = "idle";
  let errMsg = "";
  let dragOver = false;

  // reset transient state each time the modal opens (keep saved class/handle)
  let prevOpen = false;
  $: { if (open && !prevOpen) reset(); prevOpen = open; }
  function reset() { file = null; parsed = null; pasteVal = ""; status = "idle"; errMsg = ""; dragOver = false; }
  function close() { dispatch("close"); }

  async function onFile(f: File | null) {
    if (!f) return;
    file = f; status = "parsing"; errMsg = "";
    try {
      parsed = parseXrk(await f.arrayBuffer());
      if (!parsed.laps.length) { errMsg = "No laps found in that file."; status = "error"; parsed = null; return; }
      status = "ready";
    } catch {
      errMsg = "Couldn't read that .xrk file."; status = "error"; parsed = null;
    }
  }
  function onPick(e: Event) {
    const t = e.target as HTMLInputElement;
    onFile(t.files && t.files.length ? t.files[0] : null);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault(); dragOver = false;
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onFile(f);
  }
  function applyPaste() {
    const nums = pasteVal.split(/[^0-9.]+/).map(Number).filter((x) => x > 0 && x < 600);
    if (!nums.length) { errMsg = "No lap times found in that text."; status = "error"; return; }
    const flying = nums.filter((x) => x >= 15 && x <= 180);
    parsed = { date: "", time: "", laps: nums, best: flying.length ? Math.min(...flying) : Math.min(...nums) };
    file = null; status = "ready"; errMsg = "";
  }

  async function submit() {
    if (!parsed) return;
    if (klass) localStorage.setItem("gc_class", klass);
    localStorage.setItem("gc_handle", handle);
    const s = get(app);
    const meta: ContribMeta = {
      track: s.name || "", lat: s.lat, lon: s.lon,
      klass, handle: handle.trim(),
      date: parsed.date, time: parsed.time,
      nLaps: parsed.laps.length, best: parsed.best, laps: parsed.laps,
    };
    if (!$shareData) { status = "local"; return; }
    status = "sending"; errMsg = "";
    const r = await uploadContribution(meta, file);
    if (r.ok) status = "done";
    else if (r.skipped) status = "local";
    else { errMsg = r.error || "Upload failed — try again."; status = "error"; }
  }

  $: best = parsed ? parsed.best : null;
  $: lapCount = parsed ? parsed.laps.length : 0;
  $: vizLaps = parsed ? parsed.laps.filter((x) => x >= 10 && x <= 200) : [];
  $: vizMin = vizLaps.length ? Math.min(...vizLaps) : 0;
  $: vizMax = vizLaps.length ? Math.max(...vizLaps) : 1;
  $: vizBars = vizLaps.map((l) => ({ l, h: 5 + 26 * (vizMax - l) / ((vizMax - vizMin) || 1), best: l === best }));
</script>

{#if open}
<div class="cmodal" on:click|self={close} role="presentation">
  <div class="cbox">
    <div class="chead">
      <span class="ctitle">Contribute your laps</span>
      <button class="cx" on:click={close} aria-label="close">✕</button>
    </div>

    {#if status === "done" || status === "local"}
      <div class="cdone">
        <div class="cbig">{status === "done" ? "Thanks — your laps are in. 🏁" : "Saved on this device — not shared."}</div>
        {#if parsed}
          <div class="cprev">
            <div class="cstat"><span class="cnum">{best != null ? fmtLap(best) : "—"}</span><span class="clab">best</span></div>
            <div class="cstat"><span class="cnum">{lapCount}</span><span class="clab">laps</span></div>
            {#if parsed.date}<div class="cstat"><span class="cnum">{parsed.date}</span><span class="clab">session</span></div>{/if}
          </div>
        {/if}
        <button class="cbtn" on:click={close}>Done</button>
        <button class="clink" on:click={reset}>Add another</button>
      </div>
    {:else}
      <div class="cbody">
        <div class="cdrop" class:over={dragOver} class:has={!!parsed}
             on:click={() => fileInput.click()}
             on:dragover|preventDefault={() => (dragOver = true)}
             on:dragleave={() => (dragOver = false)}
             on:drop={onDrop}
             role="button" tabindex="0">
          {#if status === "parsing"}
            <span class="cdrop-h">reading…</span>
          {:else if parsed}
            <span class="cdrop-h">{file ? file.name : "lap times"} · {lapCount} laps</span>
            <span class="cdrop-s">tap to choose a different file</span>
          {:else}
            <span class="cdrop-h">Drop an AiM .xrk file</span>
            <span class="cdrop-s">or tap to browse</span>
          {/if}
          <input bind:this={fileInput} type="file" accept=".xrk" on:change={onPick} hidden />
        </div>

        <details class="cpaste">
          <summary>or paste lap times (from any logger)</summary>
          <textarea bind:value={pasteVal} rows="2" placeholder="e.g. 42.9, 43.1, 42.7"></textarea>
          <button class="csm" on:click={applyPaste}>use these</button>
        </details>

        {#if parsed}
          <div class="cprev">
            <div class="cstat"><span class="cnum">{best != null ? fmtLap(best) : "—"}</span><span class="clab">best</span></div>
            <div class="cstat"><span class="cnum">{lapCount}</span><span class="clab">laps</span></div>
            {#if parsed.date}<div class="cstat"><span class="cnum">{parsed.date}</span><span class="clab">{parsed.time || "session"}</span></div>{/if}
          </div>
          {#if vizBars.length}
            <div class="cbars" aria-hidden="true">
              {#each vizBars as b}<i style="height:{b.h}px" class:best={b.best}></i>{/each}
            </div>
          {/if}
        {/if}

        <div class="cfields">
          <label class="cf">
            <span>class</span>
            <select bind:value={klass}>{#each CLASSES as c}<option value={c}>{c}</option>{/each}</select>
          </label>
          <label class="cf">
            <span>name (optional)</span>
            <input type="text" bind:value={handle} maxlength="32" placeholder="anonymous" />
          </label>
        </div>

        <div class="cshare">
          <p class="cnote">Your laps help improve grip &amp; lap-time accuracy for {get(app).name || "this track"}.</p>
          <label class="ctoggle">
            <input type="checkbox" bind:checked={$shareData} />
            <span>Share my laps to improve GripCast (anonymous)</span>
          </label>
        </div>

        {#if errMsg}<div class="cerr">{errMsg}</div>{/if}

        <button class="cbtn" disabled={!parsed || status === "sending"} on:click={submit}>
          {status === "sending" ? "Sending…" : $shareData ? "Submit" : "Save locally"}
        </button>
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
  .cmodal {
    position: fixed; inset: 0; z-index: 1200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    background: rgba(8, 8, 14, 0.55); backdrop-filter: blur(6px);
  }
  .cbox {
    width: min(420px, 100%); max-height: 88vh; overflow: auto;
    background: rgba(22, 22, 32, 0.94); border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px; box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
    color: #fff; font-size: 14px;
  }
  .chead { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 10px; }
  .ctitle { font-weight: 700; font-size: 16px; letter-spacing: -0.2px; }
  .cx { background: none; border: 0; color: rgba(255, 255, 255, 0.6); font-size: 16px; cursor: pointer; }
  .cbody, .cdone { padding: 4px 18px 18px; display: flex; flex-direction: column; gap: 12px; }
  .cdone { align-items: center; text-align: center; padding-top: 18px; gap: 14px; }
  .cbig { font-size: 16px; font-weight: 600; line-height: 1.4; }

  .cdrop {
    border: 1.5px dashed rgba(255, 255, 255, 0.22); border-radius: 13px;
    padding: 22px 14px; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s;
    display: flex; flex-direction: column; gap: 4px;
  }
  .cdrop.over, .cdrop:hover { border-color: rgb(var(--accent)); background: rgba(255, 255, 255, 0.03); }
  .cdrop.has { border-style: solid; border-color: rgba(var(--accent), 0.6); }
  .cdrop-h { font-weight: 600; }
  .cdrop-s { font-size: 12px; color: rgba(255, 255, 255, 0.5); }

  .cpaste { font-size: 12.5px; color: rgba(255, 255, 255, 0.62); }
  .cpaste summary { cursor: pointer; }
  .cpaste textarea {
    width: 100%; margin-top: 8px; box-sizing: border-box; resize: vertical;
    background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 9px; color: #fff; padding: 8px; font: inherit;
  }
  .csm, .clink { background: none; border: 0; color: rgb(var(--accent)); cursor: pointer; font: inherit; padding: 6px 0; }
  .csm { margin-top: 4px; }

  .cprev { display: flex; gap: 10px; }
  .cstat {
    flex: 1; background: rgba(255, 255, 255, 0.05); border-radius: 11px; padding: 9px 6px;
    display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .cnum { font-weight: 700; font-size: 17px; font-variant-numeric: tabular-nums; }
  .clab { font-size: 11px; color: rgba(255, 255, 255, 0.5); }

  .cbars { display: flex; align-items: flex-end; gap: 2px; height: 32px; padding: 0 2px; }
  .cbars i { flex: 1; min-width: 2px; background: rgba(255, 255, 255, 0.28); border-radius: 1px; }
  .cbars i.best { background: rgb(var(--accent)); }

  .cfields { display: flex; gap: 10px; }
  .cf { flex: 1; display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: rgba(255, 255, 255, 0.6); }
  .cf select, .cf input {
    background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 9px; color: #fff; padding: 8px; font: inherit;
  }

  .cshare { background: rgba(255, 255, 255, 0.04); border-radius: 12px; padding: 11px 12px; }
  .cnote { margin: 0 0 8px; font-size: 12.5px; color: rgba(255, 255, 255, 0.68); line-height: 1.45; }
  .ctoggle { display: flex; align-items: center; gap: 9px; cursor: pointer; font-size: 13px; }
  .ctoggle input { width: 16px; height: 16px; accent-color: rgb(var(--accent)); }

  .cerr { color: #ff9a8a; font-size: 12.5px; }

  .cbtn {
    background: rgb(var(--accent)); color: #0b0b12; border: 0; border-radius: 11px;
    padding: 12px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 2px;
  }
  .cbtn:disabled { opacity: 0.45; cursor: default; }
</style>
