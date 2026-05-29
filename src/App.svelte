<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { app, view, loadPlace, setLive, selectDay, setHour, recentsStore, FEATURED } from "./lib/stores";
  import { t as trStore, tg as tgStore, lang, setLang, LANGS, HINT_RECENTS, SHARE_LABEL, COPIED_LABEL } from "./lib/i18n";
  import { fmt, toggleUnits } from "./lib/units";
  import { airDensity, jetting, trackTemp, tyreArrow, bestWindow } from "./lib/karting";
  import { trackNow, pad, lsGet } from "./lib/util";
  import { dayW, hourW } from "./lib/weather";
  import { scoreOf, precipCat } from "./lib/score";
  import { computeSky, type SkyOut } from "./lib/sky";
  import Clouds from "./components/Clouds.svelte";
  import Fx from "./components/Fx.svelte";
  import SearchModal from "./components/SearchModal.svelte";
  import TrendsGraph from "./components/TrendsGraph.svelte";
  import RainTimeline from "./components/RainTimeline.svelte";

  $: tr = $trStore;
  $: tg = $tgStore;

  let searchOpen = false, quickOpen = false, detailsOpen = false, langOpen = false, timelineOpen = false, graphOpen = false;
  let quickPos = { left: 0, top: 0 }, detailsPos = { left: 0, top: 0 }, langPos = { left: 0, top: 0 };
  let placeEl: HTMLElement, condDetEl: HTMLElement, globeEl: HTMLElement, quickEl: HTMLElement, detailsEl: HTMLElement, langEl: HTMLElement;
  let searchComp: any;

  // sky
  let skyOut: SkyOut = computeSky({ phase: "night", cloud: 30, wind: 6, temp: 12 });
  $: if ($view) skyOut = $view.sky;
  function applySkyRaw(s: SkyOut) {
    const r = document.documentElement.style;
    s.stops.forEach((c, i) => r.setProperty(`--sky${i + 1}`, c));
    document.body.classList.toggle("light-sky", s.lightSky);
  }
  $: applySkyRaw(skyOut);
  $: windVal = $view ? $view.w.wind : 6;
  $: phaseLabel = tg("phases", $view ? $view.phase : "night");

  // clock + countdown
  let timeStr = "--:--", tzStr = "", cdStr = "", cdLabel = "";
  function updateClock() {
    const s = get(app);
    if (!s.data) { timeStr = "--:--"; tzStr = ""; cdStr = ""; cdLabel = ""; return; }
    const p = trackNow(s.tzOffset);
    timeStr = pad(p.h) + ":" + pad(p.m); tzStr = s.tzAbbr || "";
    if (s.live) {
      const hd = s.todayISO ? s.hourly[s.todayISO] : null;
      if (hd && hd.code.length) {
        const g = hd.code.map((_, i) => scoreOf(hourW(hd, i)).s10);
        let bi = -1, bg = -1; for (let i = p.h + 1; i < 24; i++) if (g[i] > bg) { bg = g[i]; bi = i; }
        const ng = g[p.h] ?? 0;
        if (bi >= 0 && bg > ng + 0.15) { const sec = (bi * 60 - p.min) * 60 - p.s; cdStr = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}`; cdLabel = $trStore("toPeak"); }
        else { cdStr = "✓"; cdLabel = $trStore("peakNow"); }
      } else { cdStr = ""; cdLabel = ""; }
    } else {
      const hd = s.selDate ? s.hourly[s.selDate] : null;
      if (hd && hd.code.length) { let bi = 12, bg = -1; for (let i = 0; i < hd.code.length; i++) { const gg = scoreOf(hourW(hd, i)).s10; if (gg > bg) { bg = gg; bi = i; } } cdStr = pad(bi) + ":00"; cdLabel = $trStore("peakGrip"); }
      else { cdStr = ""; cdLabel = ""; }
    }
  }
  $: { void $app; void $lang; updateClock(); }

  $: dateLabel = $view ? new Date($view.selDate + "T00:00").toLocaleDateString($lang, { month: "short", day: "numeric" }) : "";
  $: scoreText = $view ? $view.score.s10.toFixed(1) : "?";
  $: moodClass = $view ? "m-" + $view.score.mood : "";
  $: tagline = $view ? tg("tags", $view.score.tagKey) : tr("reading");
  $: placeName = $app.name || tr("tapBegin");

  $: detailRows = $view ? [
    [tr("temp"), $fmt.tempU($view.w.temp)],
    [tr("feelsLike"), $fmt.tempU($view.w.feels)],
    [tr("humidity"), $view.w.humidity != null ? Math.round($view.w.humidity) + "%" : "—"],
    [tr("cloud"), $view.w.cloud != null ? Math.round($view.w.cloud) + "%" : "—"],
    [tr("wind"), $fmt.speed($view.w.wind)],
    [tr("gusts"), $fmt.speed($view.w.gust)],
    [tr("precip"), precipLabel($view.w.precip)],
    [tr("pressure"), $view.w.pressure != null ? Math.round($view.w.pressure) + " hPa" : "—"],
  ] : [];
  $: dryScore = $view ? scoreOf($view.w, "dry").s10.toFixed(1) : "";
  $: wetScore = $view ? scoreOf($view.w, "wet").s10.toFixed(1) : "";
  $: curHourly = $app.selDate ? $app.hourly[$app.selDate] : null;
  $: fromHour = $view && $view.live ? trackNow($app.tzOffset).h : ($view ? $view.selHour : 0);
  function precipLabel(mm: number | null | undefined) { if (mm == null) return "—"; const c = precipCat(mm); return c ? tr(c) + " · " + mm.toFixed(1) + " mm" : mm.toFixed(1) + " mm"; }
  // karting tools
  $: daylight = $view ? ["day", "golden", "dawn"].includes($view.phase) : false;
  $: air = $view && $view.w.pressure != null ? airDensity($view.w.temp, $view.w.pressure, $view.w.humidity) : null;
  $: jet = air ? jetting(air.relPct) : null;
  $: tTrack = $view ? trackTemp($view.w.temp, $view.w.cloud, daylight) : null;
  $: bWindow = curHourly ? bestWindow(curHourly, fromHour) : null;

  function onHour(e: Event) { setHour(+(e.target as HTMLInputElement).value); }
  function dayScore(i: number) { return $app.data ? scoreOf(dayW($app.data, i)).s10 : 0; }
  function fmtDay(ds: string) { return new Date(ds + "T00:00").toLocaleDateString($lang, { day: "numeric", month: "short" }); }

  function toggleQuick() { detailsOpen = false; langOpen = false; if (quickOpen) { quickOpen = false; return; } const r = placeEl.getBoundingClientRect(); quickPos = { left: Math.max(16, r.left + r.width / 2 - 160), top: r.bottom + 10 }; quickOpen = true; }
  function toggleDetails() { if (!$view) return; quickOpen = false; if (detailsOpen) { detailsOpen = false; return; } const r = condDetEl.getBoundingClientRect(); detailsPos = { left: Math.min(innerWidth - 360, Math.max(16, r.left - 40)), top: r.top - 10 }; detailsOpen = true; }
  function toggleLang() { quickOpen = false; detailsOpen = false; if (langOpen) { langOpen = false; return; } const r = globeEl.getBoundingClientRect(); langPos = { left: r.left, top: r.bottom + 8 }; langOpen = true; }
  function pick(p: any) { quickOpen = false; loadPlace(p.lat, p.lon, p.name); }
  function onSelect(e: CustomEvent) { searchOpen = false; loadPlace(e.detail.lat, e.detail.lon, e.detail.name); }
  function openSearch() { quickOpen = false; searchOpen = true; }
  function geoFromQuick() { quickOpen = false; searchOpen = true; setTimeout(() => searchComp?.triggerGeo(), 60); }

  function onWindowClick(e: MouseEvent) {
    const tgt = e.target as Node;
    if (quickOpen && !placeEl?.contains(tgt) && !quickEl?.contains(tgt)) quickOpen = false;
    if (langOpen && !globeEl?.contains(tgt) && !langEl?.contains(tgt)) langOpen = false;
    if (detailsOpen && !condDetEl?.contains(tgt) && !detailsEl?.contains(tgt) && !(e.target as HTMLElement)?.id?.includes("blurbDet")) detailsOpen = false;
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "/" && !searchOpen && (document.activeElement as HTMLElement)?.tagName !== "INPUT") { e.preventDefault(); openSearch(); }
    if (e.key === "Escape") { searchOpen = false; quickOpen = false; detailsOpen = false; langOpen = false; }
  }
  function onBlurbClick(e: MouseEvent) { if ((e.target as HTMLElement).id === "blurbDet") toggleDetails(); }
  function toggleTimeline() { timelineOpen = !timelineOpen; }
  function toggleGraph() { if ($app.data) graphOpen = !graphOpen; }

  // ---- deep-link routing (#/lat,lon/date?n=Name) ----
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    if (!h) return null;
    const [path, query] = h.split("?");
    const [coords, date] = path.split("/");
    const m = coords && coords.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
    if (!m) return null;
    const p = new URLSearchParams(query || "");
    return { lat: +m[1], lon: +m[2], date: date || null, name: decodeURIComponent(p.get("n") || "track") };
  }
  function buildHash(s: typeof $app) {
    if (s.lat == null) return "";
    return `#/${s.lat.toFixed(4)},${s.lon.toFixed(4)}/${s.selDate || ""}?n=${encodeURIComponent(s.name)}`;
  }
  let lastHash = "";
  function updateHash() {
    const s = get(app); const h = buildHash(s);
    if (h && h !== location.hash) { lastHash = h; history.replaceState(null, "", h); }
  }
  $: { void $app.lat; void $app.lon; void $app.selDate; void $app.name; updateHash(); }
  async function onHashChange() {
    if (location.hash === lastHash) return;
    const r = parseHash(); if (!r) return;
    const s = get(app);
    if (s.lat != null && Math.abs(s.lat - r.lat) < 1e-4 && Math.abs(s.lon - r.lon) < 1e-4) return;
    await loadPlace(r.lat, r.lon, r.name);
    if (r.date) { const idx = get(app).data?.daily.time.indexOf(r.date) ?? -1; if (idx >= 0) selectDay(idx); }
  }

  let copied = false;
  function shareLink() {
    quickOpen = false;
    try { navigator.clipboard?.writeText(location.href); } catch {}
    copied = true; setTimeout(() => (copied = false), 1600);
  }

  onMount(() => {
    const iv = setInterval(updateClock, 1000); updateClock();
    (async () => {
      const r = parseHash();
      if (r) {
        await loadPlace(r.lat, r.lon, r.name);
        if (r.date) { const idx = get(app).data?.daily.time.indexOf(r.date) ?? -1; if (idx >= 0) selectDay(idx); }
      } else {
        const last = lsGet<{ lat: number; lon: number; name: string }>("gc_last");
        if (last) loadPlace(last.lat, last.lon, last.name);
      }
    })();
    addEventListener("hashchange", onHashChange);
    return () => { clearInterval(iv); removeEventListener("hashchange", onHashChange); };
  });
</script>

<svelte:window on:click={onWindowClick} on:keydown={onKey} />

<svg width="0" height="0" style="position:absolute"><defs>
  <filter id="cw0"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="2" seed="7" /><feDisplacementMap in="SourceGraphic" scale="60" /></filter>
  <filter id="cw1"><feTurbulence type="fractalNoise" baseFrequency="0.01 0.05" numOctaves="2" seed="22" /><feDisplacementMap in="SourceGraphic" scale="70" /></filter>
  <filter id="cw2"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.035" numOctaves="2" seed="41" /><feDisplacementMap in="SourceGraphic" scale="55" /></filter>
</defs></svg>

<div id="sky"></div>
<Clouds count={skyOut.cloudCount} wind={windVal} color={skyOut.cloudColor} />
<Fx mode={skyOut.fxMode} precip={$view ? $view.w.precip : 0} wind={windVal} dark={!skyOut.lightSky} />
<div class="vignette"></div>

<div class="stage">
  <div class="topbar">
    <div class="topleft">
      <button class="globe" bind:this={globeEl} on:click={toggleLang}>🌐 {$lang.toUpperCase()}</button>
      <button class="unit" on:click={toggleUnits} title="units">{$fmt.tUnit}</button>
      <span class="date">{dateLabel || "—"}</span>
    </div>
    <div class="mid">{$view ? phaseLabel : ""}</div>
    <div class="clock"><span>{timeStr}</span><span class="tz">{tzStr}</span><span class="cd">{cdStr}</span><span class="cdlabel">{cdLabel}</span></div>
  </div>

  <div class="center">
    <div class="place" bind:this={placeEl} on:click={toggleQuick} role="button" tabindex="0"><span class="nm">{placeName}</span><span class="chev">▾</span></div>
    {#key scoreText + (moodClass)}
      <div class="score {moodClass} fade">{scoreText}<span class="den">/10</span></div>
    {/key}
    <div class="tagline">{tagline}</div>
    {#if $view}
      <div class="subtag">{tg("why", $view.score.whyKey)}</div>
      <div class="stats">
        <span><span class="lab">{$view.live ? tr("nowLbl") : pad($app.selHour) + ":00"}</span> <b>{$fmt.temp($view.w.feels)}</b></span>
        <span class="det" bind:this={condDetEl} on:click={toggleDetails} role="button" tabindex="0"><b>{$view.score.label}</b></span>
        <span><span class="lab">{tr("wind")}</span> <b>{$fmt.speed($view.w.wind)}</b>{#if $view.w.dir != null}<span class="wdir" style="transform:rotate({($view.w.dir + 180) % 360}deg)">↑</span>{/if}</span>
      </div>
      <div class="scrub show">
        <input type="range" min="0" max="23" step="1" value={$app.selHour} on:input={onHour} aria-label="hour" />
        <div class="lab"><span>{$view.live ? tr("nowLbl") : pad($app.selHour) + ":00"}</span><span class="nowbtn" on:click={setLive} role="button" tabindex="0">{tr("scrubNow")}</span></div>
      </div>
      <RainTimeline hd={curHourly} {fromHour} live={$view.live} />
    {/if}
  </div>
</div>

<div class="blurb" on:click={onBlurbClick} role="presentation">{@html tr("blurbHtml")}</div>
<div class="hint">{HINT_RECENTS[$lang] || HINT_RECENTS.en} · <b on:click={toggleTimeline} role="button" tabindex="0">▣ {tr("timeline")}</b> · <b on:click={toggleGraph} role="button" tabindex="0">📈 {tr("trends")}</b></div>

{#if quickOpen}
  <div class="popup anim-pop" bind:this={quickEl} style="left:{quickPos.left}px;top:{quickPos.top}px">
    <div class="head">{tr("jumpTo")}</div>
    <div class="row" on:click={openSearch} role="button" tabindex="0"><span class="ic">🔍</span><span class="nm">{tr("searchPlaces")}</span></div>
    <div class="row" on:click={geoFromQuick} role="button" tabindex="0"><span class="ic">◎</span><span class="nm">{tr("nearMe")}</span></div>
    {#if $app.lat != null}<div class="row" on:click={shareLink} role="button" tabindex="0"><span class="ic">🔗</span><span class="nm">{SHARE_LABEL[$lang] || SHARE_LABEL.en}</span></div>{/if}
    {#if $recentsStore.length}<div class="head">{tr("recent")}</div>{#each $recentsStore as r}<div class="row" on:click={() => pick(r)} role="button" tabindex="0"><span class="ic">◷</span><span class="nm">{r.name}</span></div>{/each}{/if}
    <div class="head">{tr("featured")}</div>{#each FEATURED.slice(0, 5) as f}<div class="row" on:click={() => pick(f)} role="button" tabindex="0"><span class="ic">🏁</span><span class="nm">{f.name}</span><span class="sub">{f.sub}</span></div>{/each}
  </div>
{/if}

{#if detailsOpen && $view}
  <div class="popup up anim-pop" bind:this={detailsEl} style="left:{detailsPos.left}px;top:{detailsPos.top}px">
    <div class="head">{tr("conditions")} · {$view.live ? tr("nowLbl") : dateLabel + " " + pad($app.selHour) + ":00"}</div>
    <div class="wx">
      <div class="grid">{#each detailRows as [k, v]}<span class="k">{k}</span><span class="v">{v}</span>{/each}</div>
      <div class="bars">
        <div class="bar"><div class="lab"><span>{tr("trackGrip")}</span><b>{Math.round($view.score.grip * 100)}%</b></div><div class="track"><i style="width:{Math.round($view.score.grip * 100)}%;background:#3fb98c"></i></div></div>
        <div class="bar"><div class="lab"><span>{tr("lapPace")}</span><b>{Math.round($view.score.pace * 100)}%</b></div><div class="track"><i style="width:{Math.round($view.score.pace * 100)}%;background:#d7a84e"></i></div></div>
        <div class="bar"><div class="lab"><span>{tr("comfort")}</span><b>{Math.round($view.score.comfort * 100)}%</b></div><div class="track"><i style="width:{Math.round($view.score.comfort * 100)}%;background:#6fa8d8"></i></div></div>
      </div>
      <div class="head" style="padding-left:0">{tr("dryVsWet")}</div>
      <div class="wetcmp">
        <div class="c" class:active={$view.w.precip < 0.1}><div class="n">{dryScore}</div><div class="t">{tr("dryLine")}</div></div>
        <div class="c" class:active={$view.w.precip >= 0.1}><div class="n">{wetScore}</div><div class="t">{tr("wetLine")}</div></div>
      </div>
      {#if air && jet}
        <div class="da">
          <div class="row1"><span>{tr("airDensity")}</span><span class="big">{air.relPct.toFixed(0)}%</span></div>
          <div class="jet">{tr("jetting")}: <b>{tr(jet.dir)}</b> ({jet.d > 0 ? "+" : ""}{jet.d.toFixed(1)}%) · DA {Math.round(air.da)} m</div>
          <div class="jet">{tr("trackTemp")} ≈ <b>{$fmt.temp(tTrack)}</b> · {tr("tyrePressure")} <b>{tyreArrow(tTrack ?? 20)}</b></div>
          {#if bWindow}<div class="jet">{tr("bestWindow")}: <b>{pad(bWindow.start)}:00–{pad(bWindow.end)}:00</b></div>{/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if langOpen}
  <div class="popup anim-pop" bind:this={langEl} style="left:{langPos.left}px;top:{langPos.top}px">
    <div class="head">{tr("language")}</div>
    {#each LANGS as [c, n]}<div class="row" class:sel={c === $lang} on:click={() => { setLang(c); langOpen = false; }} role="button" tabindex="0"><span class="ic">{c === $lang ? "●" : "○"}</span><span class="nm">{n}</span><span class="sub">{c.toUpperCase()}</span></div>{/each}
  </div>
{/if}

{#if graphOpen && $app.data}
  <div class="popup anim-pop" id="graph">
    <div class="head">{tr("trends")} · {$app.name}</div>
    <div class="glegend"><span class="lg b">{tr("trackGrip")}</span><span class="lg a">{tr("temp")}</span><span class="lg r">{tr("precip")}</span></div>
    <div class="gwrap"><TrendsGraph data={$app.data} selDate={$app.selDate} on:select={(e) => selectDay(e.detail)} /></div>
  </div>
{/if}

{#if timelineOpen && $app.data}
  <div class="timeline">
    {#each $app.data.daily.time as ds, i}
      <div class="tl-day" class:today={i === $app.todayIdx} class:sel={ds === $app.selDate} on:click={() => selectDay(i)} role="button" tabindex="0">
        <div class="bar" style="height:{6 + dayScore(i) * 4}px"></div>
        <div class="d">{i === $app.todayIdx ? tr("nowLbl") : fmtDay(ds)}</div>
      </div>
    {/each}
  </div>
{/if}

{#if copied}<div class="toast">{COPIED_LABEL[$lang] || COPIED_LABEL.en}</div>{/if}

<SearchModal bind:this={searchComp} open={searchOpen} on:select={onSelect} on:close={() => (searchOpen = false)} />
