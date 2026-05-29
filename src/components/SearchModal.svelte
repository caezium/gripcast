<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import { t as trStore } from "../lib/i18n";
  import { lang } from "../lib/i18n";
  import { recentsStore, FEATURED } from "../lib/stores";
  import { photon, overpassAround, dist, dedupe, parseCoords, type Place } from "../lib/geo";
  import MapView from "./MapView.svelte";

  export let open = false;
  const dispatch = createEventDispatcher();
  $: tr = $trStore;

  let q = "";
  let inputEl: HTMLInputElement;
  let loading = false;
  let viewMode: "list" | "map" = "list";
  let screen: "browse" | "results" | "nearby" = "browse";
  let tracks: Place[] = [], places: Place[] = [], near: Place[] = [];
  let myLoc: { lat: number; lon: number } | null = null;
  let collapsed: Record<string, boolean> = { tracks: false, places: false };
  let trackLoading = false;
  let deb: any, reqId = 0;
  let selIdx = -1;

  $: if (open) reset();
  async function reset() { q = ""; loading = false; viewMode = "list"; screen = "browse"; selIdx = -1; await tick(); inputEl?.focus(); }

  function onInput() {
    selIdx = -1;
    clearTimeout(deb);
    const v = q.trim();
    if (v.length < 2) { screen = "browse"; loading = false; return; }
    deb = setTimeout(() => doSearch(v), 230);
  }
  async function doSearch(v: string) {
    const co = parseCoords(v);
    if (co) { tracks = [{ name: `${co.lat.toFixed(4)}, ${co.lon.toFixed(4)}`, lat: co.lat, lon: co.lon, isTrack: true }]; places = []; trackLoading = false; screen = "results"; return; }
    const id = ++reqId; loading = true; screen = "results";
    let gen: Place[] = [];
    try { gen = await photon(v, undefined, $lang); } catch {}
    if (id !== reqId) return;
    tracks = gen.filter((r) => r.isTrack); places = gen.filter((r) => !r.isTrack);
    loading = false;
    const top = places[0] || gen[0];
    trackLoading = !!top;
    if (top) {
      let nb: Place[] = [];
      try { nb = await overpassAround(top.lat, top.lon, 40, 20); }
      catch { try { nb = (await photon("karting", top, $lang)).map((r) => ({ ...r, isTrack: true })); } catch {} }
      if (id !== reqId) return;
      tracks = dedupe([...tracks, ...nb]).sort((a, b) => (b.kart ? 1 : 0) - (a.kart ? 1 : 0) || dist(top.lat, top.lon, a.lat, a.lon) - dist(top.lat, top.lon, b.lat, b.lon));
      trackLoading = false;
    }
  }
  async function doGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (p) => {
      myLoc = { lat: p.coords.latitude, lon: p.coords.longitude };
      screen = "nearby"; near = []; trackLoading = true;
      try { near = (await overpassAround(myLoc.lat, myLoc.lon, 60, 30)).sort((a, b) => dist(myLoc!.lat, myLoc!.lon, a.lat, a.lon) - dist(myLoc!.lat, myLoc!.lon, b.lat, b.lon)); } catch {}
      trackLoading = false;
    });
  }
  function choose(p: Place) { dispatch("select", { lat: p.lat, lon: p.lon, name: p.name }); }
  function clear() { q = ""; screen = "browse"; selIdx = -1; inputEl?.focus(); }
  export function triggerGeo() { doGeo(); }

  // flat list for keyboard nav
  $: navRows = (() => {
    if (viewMode === "map") return [];
    if (screen === "browse") return [{ geo: true } as any, ...$recentsStore.map((r) => ({ ...r, isTrack: false })), ...FEATURED.map((f: any) => ({ ...f, isTrack: true }))];
    if (screen === "nearby") return [...(myLoc ? [{ name: tr("myLoc"), lat: myLoc.lat, lon: myLoc.lon } as any] : []), ...near];
    return [...tracks, ...places];
  })();
  function onKey(e: KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); selIdx = Math.min(selIdx + 1, navRows.length - 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selIdx = Math.max(selIdx - 1, 0); }
    else if (e.key === "Enter") { e.preventDefault(); const r = navRows[selIdx] || navRows[0]; if (r) { if (r.geo) doGeo(); else choose(r); } }
  }
</script>

{#if open}
<div class="search" on:click|self={() => dispatch("close")} role="presentation">
  <div class="search-box">
    <div class="search-top">
      <div class="input-wrap" class:loading class:has-val={!!q}>
        <span class="mag">🔍</span>
        <input bind:this={inputEl} bind:value={q} on:input={onInput} on:keydown={onKey} type="text" placeholder={tr("ph")} autocomplete="off" />
        <span class="spin"></span><span class="clr" on:click={clear} role="button" tabindex="-1">✕</span>
      </div>
      <div class="seg">
        <button class:active={viewMode === "list"} on:click={() => (viewMode = "list")}>{tr("list")}</button>
        <button class:active={viewMode === "map"} on:click={() => (viewMode = "map")}>{tr("map")}</button>
      </div>
    </div>

    <div class="panelbody">
      {#if viewMode === "map"}
        <MapView active={open && viewMode === "map"} lat={myLoc?.lat ?? 45.42} lon={myLoc?.lon ?? 10.5} on:select={(e) => choose(e.detail)} />
      {:else}
        <div class="sugg">
          {#if screen === "browse"}
            <div class="row geo" class:sel={selIdx === 0} on:click={doGeo} role="button" tabindex="-1"><span class="ic">◎</span><span class="nm">{tr("nearMe")}</span></div>
            {#if $recentsStore.length}
              <div class="secthead"><span class="tw">▾</span>{tr("recent")}<span class="cnt">{$recentsStore.length}</span></div>
              {#each $recentsStore as r}<div class="row" on:click={() => choose({ ...r })} role="button" tabindex="-1"><span class="ic">◷</span><span class="nm">{r.name}</span></div>{/each}
            {/if}
            <div class="secthead"><span class="tw">▾</span>{tr("featured")}<span class="cnt">{FEATURED.length}</span></div>
            {#each FEATURED as f}<div class="row" on:click={() => choose(f)} role="button" tabindex="-1"><span class="ic">🏁</span><span class="nm">{f.name}</span><span class="sub">{f.sub}</span></div>{/each}
          {:else if screen === "nearby"}
            {#if myLoc}<div class="row" on:click={() => choose({ name: tr("myLoc"), lat: myLoc.lat, lon: myLoc.lon })} role="button" tabindex="-1"><span class="ic">📍</span><span class="nm">{tr("myLoc")}</span></div>{/if}
            <div class="secthead"><span class="tw">▾</span>{tr("tracks")}<span class="cnt">{near.length}</span>{#if trackLoading}<span class="mini"></span>{/if}</div>
            {#each near as r}<div class="row" on:click={() => choose(r)} role="button" tabindex="-1"><span class="ic">🏁</span><span class="nm">{r.name}</span>{#if myLoc}<span class="dist">{dist(myLoc.lat, myLoc.lon, r.lat, r.lon).toFixed(0)} km</span>{/if}</div>{/each}
            {#if !near.length && !trackLoading}<div class="empty">{tr("noMatch")}</div>{/if}
          {:else}
            {#if tracks.length || trackLoading}
              <div class="secthead" class:collapsed={collapsed.tracks} on:click={() => (collapsed.tracks = !collapsed.tracks)} role="button" tabindex="-1"><span class="tw">▾</span>{tr("tracks")}<span class="cnt">{tracks.length}</span>{#if trackLoading}<span class="mini"></span>{/if}</div>
              {#if !collapsed.tracks}<div class="sect">{#each tracks as r}<div class="row" on:click={() => choose(r)} role="button" tabindex="-1"><span class="ic">🏁</span><span class="nm">{r.name}</span>{#if r.sub}<span class="sub">{r.sub}</span>{/if}</div>{/each}</div>{/if}
            {/if}
            {#if places.length}
              <div class="secthead" class:collapsed={collapsed.places} on:click={() => (collapsed.places = !collapsed.places)} role="button" tabindex="-1"><span class="tw">▾</span>{tr("places")}<span class="cnt">{places.length}</span></div>
              {#if !collapsed.places}<div class="sect">{#each places as r}<div class="row" on:click={() => choose(r)} role="button" tabindex="-1"><span class="ic">◷</span><span class="nm">{r.name}</span>{#if r.sub}<span class="sub">{r.sub}</span>{/if}</div>{/each}</div>{/if}
            {/if}
            {#if !tracks.length && !places.length && !trackLoading}<div class="empty">{tr("noMatch")}</div>{/if}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
