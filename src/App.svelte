<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { app, view, loadPlace, setLive, selectDay, setHour, recentsStore, FEATURED } from "./lib/stores";
  import { t as trStore, tg as tgStore, lang, setLang, LANGS, HINT_RECENTS, SHARE_LABEL, COPIED_LABEL, COMPARE_LABEL, NEXTGOOD_LABEL, NOTIFY_LABEL, TOOLS_LABEL, LAP_LABEL } from "./lib/i18n";
  import { theoreticalLap, fmtLap, defaultBaseline, lengthBaseline, KART_CLASS } from "./lib/laptime";
  import { PERSONAL, isPersonalTrack, personalLimit } from "./lib/personal";
  import MyLaps from "./components/MyLaps.svelte";
  import { buildHours, highlights } from "./lib/dash";
  import Dashboard from "./components/Dashboard.svelte";
  import { fmt, toggleUnits } from "./lib/units";
  import { airDensity, trackTemp, bestWindow } from "./lib/karting";
  import { ENGINES, ENGINE_MAP, jet, turnsStr, vsBaseline } from "./lib/jetting";
  import { COMPOUNDS, COMPOUND_MAP, coldPressure } from "./lib/tyres";
  import { fetchWeather, liveW, dayW, hourW, type Weather } from "./lib/weather";
  import { activate } from "./lib/a11y";
  import { trackNow, pad, lsGet } from "./lib/util";
  import { scoreOf, precipCat } from "./lib/score";
  import { computeSky, type SkyOut } from "./lib/sky";
  import Clouds from "./components/Clouds.svelte";
  import Fx from "./components/Fx.svelte";
  import SearchModal from "./components/SearchModal.svelte";
  import TrendsGraph from "./components/TrendsGraph.svelte";
  import RainTimeline from "./components/RainTimeline.svelte";
  import Contribute from "./components/Contribute.svelte";

  $: tr = $trStore;
  $: tg = $tgStore;

  let searchOpen = false, quickOpen = false, detailsOpen = false, langOpen = false, timelineOpen = false, graphOpen = false;
  let contribOpen = false;
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
  // cache the peak-grip scan so the 24-hour rescore runs on hour/day change, not every second
  let _clkKey = "", _clkPeak: { hour: number; better: boolean } | null = null;
  function updateClock() {
    const s = get(app);
    if (!s.data) { timeStr = "--:--"; tzStr = ""; cdStr = ""; cdLabel = ""; _clkKey = ""; return; }
    const p = trackNow(s.tzOffset);
    timeStr = pad(p.h) + ":" + pad(p.m); tzStr = s.tzAbbr || "";
    const hd = s.live ? (s.todayISO ? s.hourly[s.todayISO] : null) : (s.selDate ? s.hourly[s.selDate] : null);
    if (!hd || !hd.code.length) { cdStr = ""; cdLabel = ""; _clkKey = ""; return; }
    const key = s.live ? "live:" + s.todayISO + "@" + p.h : "sel:" + s.selDate;
    if (key !== _clkKey) {
      _clkKey = key;
      let bh = -1, bg = -Infinity, ng = 0;
      for (let i = 0; i < hd.code.length; i++) {
        const hour = hd.time[i] ? +hd.time[i].slice(11, 13) : i;
        const sc = scoreOf(hourW(hd, i)).s10;
        if (s.live) { if (hour === p.h) ng = sc; if (hour > p.h && sc > bg) { bg = sc; bh = hour; } }
        else if (sc > bg) { bg = sc; bh = hour; }
      }
      _clkPeak = bh >= 0 ? { hour: bh, better: !s.live || bg > ng + 0.15 } : null;
    }
    if (!s.live) { cdStr = _clkPeak ? pad(_clkPeak.hour) + ":00" : ""; cdLabel = _clkPeak ? $trStore("peakGrip") : ""; }
    else if (_clkPeak && _clkPeak.better) { const sec = (_clkPeak.hour * 60 - p.min) * 60 - p.s; cdStr = `${pad(Math.floor(sec / 3600))}:${pad(Math.floor(sec / 60) % 60)}:${pad(sec % 60)}`; cdLabel = $trStore("toPeak"); }
    else { cdStr = "✓"; cdLabel = $trStore("peakNow"); }
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
  $: tTrack = $view ? trackTemp($view.w.temp, $view.w.cloud, daylight) : null;
  $: bWindow = curHourly ? bestWindow(curHourly, fromHour) : null;
  // inline jetting (per-engine needle) + tyre (per-compound cold pressure)
  let jetEngine = localStorage.getItem("gc_engine") || "x30jr";
  let tyreCompound = localStorage.getItem("gc_tyre") || "Mojo|D2";
  function setEngine(e: Event) { jetEngine = (e.target as HTMLSelectElement).value; localStorage.setItem("gc_engine", jetEngine); }
  function setTyre(e: Event) { tyreCompound = (e.target as HTMLSelectElement).value; localStorage.setItem("gc_tyre", tyreCompound); }
  $: jetEng = ENGINE_MAP[jetEngine] || ENGINES[0];
  $: jetOut = air ? jet(jetEng, air.relPct) : null;
  $: jetBase = jet(jetEng, 100);
  $: tyreSel = COMPOUND_MAP[tyreCompound] || COMPOUNDS[0];
  $: tyreOut = $view ? coldPressure(tyreSel.brand, tyreSel.model, $view.w.temp) : null;
  $: toolL = TOOLS_LABEL[$lang] || TOOLS_LABEL.en;
  // mock lap-time mode
  let lapMode = localStorage.getItem("gc_lapmode") === "1";
  let baseBump = 0;
  function baseKey() { return `gc_base:${$app.lat?.toFixed(3)},${$app.lon?.toFixed(3)}`; }
  // personalization (Shenzhen only — calibrated from the user's .xrk telemetry)
  let personalOn = localStorage.getItem("gc_personal") !== "0";
  let myLapsOpen = false;
  $: isPersonal = $app.lat != null && $app.lon != null && isPersonalTrack($app.lat, $app.lon);
  $: personalActive = personalOn && isPersonal;
  function togglePersonal() { personalOn = !personalOn; localStorage.setItem("gc_personal", personalOn ? "1" : "0"); }

  function computeBase(a: typeof $app, _b: number, personal: boolean): { sec: number | null; src: string } {
    if (a.lat == null) return { sec: null, src: "" };
    const ov = localStorage.getItem(`gc_base:${a.lat.toFixed(3)},${a.lon?.toFixed(3)}`);
    if (ov) return { sec: +ov, src: "set" }; // a manual baseline always wins, even in personal mode
    if (personal) return { sec: personalLimit(a.selDate || trackNow(a.tzOffset).dateISO), src: "personal" };
    const known = defaultBaseline(a.name);
    if (known) return { sec: known, src: "typical" };
    if (a.trackLengthM) return { sec: lengthBaseline(a.trackLengthM), src: "length" };
    return { sec: null, src: "" };
  }
  $: baseInfo = computeBase($app, baseBump, personalActive);
  $: baseline = baseInfo.sec;
  function setBaseline(e: Event) { const v = +(e.target as HTMLInputElement).value; if (v > 0 && $app.lat != null) { localStorage.setItem(baseKey(), String(v)); baseBump++; } }
  $: lap = $view && baseline ? theoreticalLap({ grip: $view.score.grip, pace: $view.score.pace, mood: $view.score.mood }, baseline) : null;
  $: baseSrcTag = baseInfo.src === "personal" ? "★ from your laps" : baseInfo.src === "length" && $app.trackLengthM ? `≈ ${$app.trackLengthM} m` : baseInfo.src === "set" ? "set" : "";
  $: lapL = LAP_LABEL[$lang] || LAP_LABEL.en;
  function scoreClick() { if (!$view) { openSearch(); return; } lapMode = !lapMode; localStorage.setItem("gc_lapmode", lapMode ? "1" : "0"); }

  // ---- conditions dashboard (Apple-Weather-inspired) ----
  let layoutMode = (localStorage.getItem("gc_layout") as "scroll" | "twopane" | "overlay") || "scroll";
  const LAYOUTS = ["scroll", "twopane", "overlay"] as const;
  let dashOpen = false; // overlay mode
  let scrolled = false;
  function cycleLayout() { layoutMode = LAYOUTS[(LAYOUTS.indexOf(layoutMode) + 1) % 3]; localStorage.setItem("gc_layout", layoutMode); dashOpen = false; }
  $: dayHourly = $app.selDate ? $app.hourly[$app.selDate] : null;
  $: dashHours = dayHourly ? buildHours(dayHourly, baseline) : [];
  $: nowHour = $view ? ($view.live ? trackNow($app.tzOffset).h : $view.selHour) : 12;
  $: hl = dashHours.length ? highlights(dashHours, nowHour) : [];
  $: sun = $view && $app.data ? { rise: hm($app.data.daily.sunrise[$view.idx]), set: hm($app.data.daily.sunset[$view.idx]) } : null;
  function hm(iso: string) { const t = (iso || "").split("T")[1] || ""; return t.slice(0, 5); }
  function onPaneScroll(e: Event) { scrolled = (e.target as HTMLElement).scrollTop > 80; }
  $: if (typeof document !== "undefined") document.body.classList.toggle("lay-twopane", layoutMode === "twopane");

  function onHour(e: Event) { setHour(+(e.target as HTMLInputElement).value); }
  // per-day scores — recomputed once per forecast (data ref change), not on every hour-scrub
  let _dsData: Weather | null = null, dayScores: number[] = [];
  $: if ($app.data !== _dsData) { _dsData = $app.data; dayScores = $app.data ? $app.data.daily.time.map((_, i) => scoreOf(dayW($app.data!, i)).s10) : []; }
  function dayScore(i: number) { return dayScores[i] ?? 0; }
  function fmtDay(ds: string) { return new Date(ds + "T00:00").toLocaleDateString($lang, { day: "numeric", month: "short" }); }
  function fmtFullDay(ds: string) { if (!ds) return ""; const d = new Date(ds + "T00:00"); if (isNaN(+d)) return ds; return d.toLocaleDateString($lang, { weekday: "short", day: "numeric", month: "short" }); }
  $: canNotify = typeof Notification !== "undefined";

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
    if (e.key === "Escape") { searchOpen = false; quickOpen = false; detailsOpen = false; langOpen = false; myLapsOpen = false; contribOpen = false; }
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
    if (s.lat == null || s.lon == null) return "";
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
    if (s.lat != null && s.lon != null && Math.abs(s.lat - r.lat) < 1e-4 && Math.abs(s.lon - r.lon) < 1e-4) return;
    await loadPlace(r.lat, r.lon, r.name);
    if (r.date) { const idx = get(app).data?.daily.time.indexOf(r.date) ?? -1; if (idx >= 0) selectDay(idx); }
  }

  // ---- compare mode ----
  let searchMode: "select" | "compare" = "select";
  let compare: { name: string; score: ReturnType<typeof scoreOf>; w: any } | null = null;
  let compareOpen = false;
  function openCompare() { quickOpen = false; searchMode = "compare"; searchOpen = true; }
  async function onCompare(e: CustomEvent) {
    searchOpen = false; searchMode = "select";
    try {
      const d = await fetchWeather(e.detail.lat, e.detail.lon);
      const w = liveW(d);
      compare = { name: e.detail.name, score: scoreOf(w), w };
      compareOpen = true;
    } catch {}
  }
  function closeCompare() { compareOpen = false; compare = null; }

  // ---- next strong day (forecast scan) ----
  $: nextGood = (() => {
    void $lang; // re-label on language change
    const d = $app.data; if (!d) return null;
    for (let i = $app.todayIdx + 1; i < dayScores.length; i++) {
      if (dayScores[i] >= 7.5) { const ds = d.daily.time[i]; return { date: ds, label: fmtFullDay(ds), idx: i, s: dayScores[i] }; }
    }
    return null;
  })();
  async function notifyMe() {
    if (!("Notification" in window) || !nextGood) return;
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm === "granted") {
      const dl = new Date(nextGood.date + "T00:00").toLocaleDateString($lang, { weekday: "short", month: "short", day: "numeric" });
      new Notification("GripCast — " + $app.name, { body: `${NEXTGOOD_LABEL[$lang] || NEXTGOOD_LABEL.en}: ${dl} · ${nextGood.s.toFixed(1)}/10`, icon: "./icon.svg" });
      copied = true; setTimeout(() => (copied = false), 1600);
    }
  }

  let copied = false;
  function shareLink() {
    quickOpen = false;
    const p = navigator.clipboard?.writeText(location.href);
    if (!p) return; // no clipboard API / blocked — don't claim success
    p.then(() => { copied = true; setTimeout(() => (copied = false), 1600); }).catch(() => {});
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

{#if layoutMode === "twopane"}
  <aside class="sidebar">
    <div class="sb-title">tracks</div>
    {#each $recentsStore as r}<button class="sb-item" class:cur={Math.abs(r.lat - ($app.lat ?? 0)) < 1e-3 && Math.abs(r.lon - ($app.lon ?? 0)) < 1e-3} on:click={() => pick(r)}><span class="sb-nm">{r.name}</span></button>{/each}
    <div class="sb-title">featured</div>
    {#each FEATURED as f}<button class="sb-item" on:click={() => pick(f)}><span class="sb-nm">{f.name}</span><span class="sb-sub">{f.sub}</span></button>{/each}
  </aside>
{/if}

<div class="rightpane" class:scrollable={layoutMode !== "overlay"} on:scroll={onPaneScroll}>
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
    {#key (lapMode ? "lap" : scoreText) + moodClass}
      <div class="score {moodClass} fade" class:lapmode={lapMode && lap} role="button" tabindex="0" aria-label={lapMode && lap ? lapL.bestLap + " " + fmtLap(lap.sec) : scoreText + " / 10 — " + tagline} on:click={scoreClick} use:activate={scoreClick}>
        {#if lapMode && lap}{fmtLap(lap.sec)}{:else if lapMode}—{:else}{scoreText}<span class="den">/10</span>{/if}
      </div>
    {/key}
    <div class="tagline">{tagline}</div>
    {#if $view}
      <div class="subtag">{#if lapMode && lap}{#if personalActive}★ personal · {lap.gapSec >= 0 ? "+" : ""}{lap.gapSec.toFixed(1)}s vs your limit · PB {fmtLap(PERSONAL.fastest)}{:else}≈ {lapL.bestLap} · {KART_CLASS} · {lap.gapSec >= 0 ? "+" : ""}{lap.gapSec.toFixed(1)}s {lapL.vsIdeal}{/if}{:else if lapMode}{KART_CLASS} · ↓ {lapL.baseline}{:else}{tg("why", $view.score.whyKey)}{/if}</div>
      <div class="modetog-row">
        <span class="modetog" on:click={scoreClick} use:activate={scoreClick} role="button" tabindex="0">{lapMode ? lapL.showScore : lapL.showLap}</span>
        {#if isPersonal}
          <span class="modetog ptog" class:on={personalOn} on:click={togglePersonal} use:activate={togglePersonal} role="button" tabindex="0">★ personal</span>
          <span class="modetog" on:click={() => (myLapsOpen = true)} use:activate={() => (myLapsOpen = true)} role="button" tabindex="0">📊 my laps</span>
        {/if}
      </div>
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

  <div class="blurb" on:click={onBlurbClick} role="presentation">{@html tr("blurbHtml")}</div>
  <div class="hint">{HINT_RECENTS[$lang] || HINT_RECENTS.en} · <b on:click={toggleTimeline} role="button" tabindex="0">▣ {tr("timeline")}</b> · <b on:click={toggleGraph} role="button" tabindex="0">📈 {tr("trends")}</b> · <b on:click={cycleLayout} role="button" tabindex="0">▭ {layoutMode}</b>{#if layoutMode === "overlay"} · <b on:click={() => (dashOpen = true)} role="button" tabindex="0">☷ conditions</b>{/if}</div>
</div>

{#if layoutMode !== "overlay" && $view}
  <section class="dashwrap">
    <Dashboard hours={dashHours} nowH={nowHour} live={$view.live} {hl} {sun} place={$app.name} />
  </section>
{/if}
</div>

{#if layoutMode === "overlay" && dashOpen && $view}
  <div class="dashoverlay" on:click|self={() => (dashOpen = false)} role="presentation">
    <div class="dashoverlay-inner">
      <button class="dclose" on:click={() => (dashOpen = false)} aria-label="close">✕</button>
      <Dashboard hours={dashHours} nowH={nowHour} live={$view.live} {hl} {sun} place={$app.name} />
    </div>
  </div>
{/if}

{#if scrolled && layoutMode !== "overlay"}
  <div class="minihdr"><b>{$app.name}</b> · {lapMode && lap ? fmtLap(lap.sec) : scoreText + "/10"}</div>
{/if}

{#if quickOpen}
  <div class="popup anim-pop" bind:this={quickEl} style="left:{quickPos.left}px;top:{quickPos.top}px">
    <div class="head">{tr("jumpTo")}</div>
    <div class="row" on:click={openSearch} role="button" tabindex="0"><span class="ic">🔍</span><span class="nm">{tr("searchPlaces")}</span></div>
    <div class="row" on:click={geoFromQuick} role="button" tabindex="0"><span class="ic">◎</span><span class="nm">{tr("nearMe")}</span></div>
    {#if $app.lat != null}<div class="row" on:click={shareLink} use:activate={shareLink} role="button" tabindex="0"><span class="ic">🔗</span><span class="nm">{SHARE_LABEL[$lang] || SHARE_LABEL.en}</span></div>{/if}
    {#if $app.data}<div class="row" on:click={openCompare} use:activate={openCompare} role="button" tabindex="0"><span class="ic">⇄</span><span class="nm">{COMPARE_LABEL[$lang] || COMPARE_LABEL.en}</span></div>{/if}
    <div class="row" on:click={() => { quickOpen = false; contribOpen = true; }} role="button" tabindex="0"><span class="ic">📤</span><span class="nm">contribute laps</span></div>
    {#if $recentsStore.length}<div class="head">{tr("recent")}</div>{#each $recentsStore as r}<div class="row" on:click={() => pick(r)} role="button" tabindex="0"><span class="ic">◷</span><span class="nm">{r.name}</span></div>{/each}{/if}
    <div class="head">{tr("featured")}</div>{#each FEATURED.slice(0, 5) as f}<div class="row" on:click={() => pick(f)} role="button" tabindex="0"><span class="ic">🏁</span><span class="nm">{f.name}</span><span class="sub">{f.sub}</span></div>{/each}
  </div>
{/if}

{#if detailsOpen && $view}
  <div class="popup up anim-pop" bind:this={detailsEl} style="left:{detailsPos.left}px;top:{detailsPos.top}px">
    <div class="head">{tr("conditions")} · {$view.live ? tr("nowLbl") : dateLabel + " " + pad($app.selHour) + ":00"}</div>
    <div class="wx">
      <div class="explain">{tg("why", $view.score.whyKey)}</div>
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
      {#if air}
        <div class="da">
          <div class="row1"><span>{tr("airDensity")}</span><span class="big">{air.relPct.toFixed(0)}%</span> <span class="dasub">· DA {Math.round(air.da)} m</span></div>
          {#if jetOut}
            <div class="jet">{tr("jetting")} · {toolL.engine}
              <select class="toolsel" bind:value={jetEngine} on:change={setEngine}>{#each ENGINES as e}<option value={e.key}>{e.name}</option>{/each}</select>
              → <b>H {turnsStr(jetOut.H)} · L {turnsStr(jetOut.L)}</b> <span class="dasub">({vsBaseline(jetOut.H, jetBase.H)})</span>
            </div>
          {/if}
          {#if tyreOut}
            <div class="jet">{toolL.tyre}
              <select class="toolsel" bind:value={tyreCompound} on:change={setTyre}>{#each COMPOUNDS as c}<option value={c.key}>{c.label}</option>{/each}</select>
              → <b>{tyreOut.bar.toFixed(2)} bar · {tyreOut.psi.toFixed(1)} psi</b> {toolL.cold}
            </div>
          {/if}
          <div class="jet">{tr("trackTemp")} ≈ <b>{$fmt.temp(tTrack)}</b>{#if bWindow} · {tr("bestWindow")} <b>{pad(bWindow.start)}:00–{pad(bWindow.end)}:00</b>{/if}</div>
          <div class="jet">{lapL.baseline} <span class="dasub">({KART_CLASS}{baseSrcTag ? " · " + baseSrcTag : ""})</span> <input class="baseinp" type="number" step="0.1" value={baseline ? baseline.toFixed(1) : ""} placeholder="—" on:change={setBaseline} /> s{#if lap} → {lapL.bestLap} <b>{fmtLap(lap.sec)}</b> <span class="dasub">({lap.gapSec >= 0 ? "+" : ""}{lap.gapSec.toFixed(1)}s)</span>{/if}</div>
        </div>
      {/if}
      {#if nextGood}
        <div class="jet" style="margin-top:11px">{NEXTGOOD_LABEL[$lang] || NEXTGOOD_LABEL.en}: <b>{nextGood.label}</b> · {nextGood.s.toFixed(1)}
          {#if canNotify}<span class="nowbtn" on:click={notifyMe} use:activate={notifyMe} role="button" tabindex="0" style="margin-left:8px">🔔 {NOTIFY_LABEL[$lang] || NOTIFY_LABEL.en}</span>{/if}
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

{#if myLapsOpen}
  <div class="popup anim-pop" id="mylaps">
    <div class="ml-close" on:click={() => (myLapsOpen = false)} use:activate={() => (myLapsOpen = false)} role="button" tabindex="0">✕</div>
    <MyLaps />
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

{#if compareOpen && compare && $view}
  <div class="popup anim-pop cmp" id="compare">
    <div class="head">{COMPARE_LABEL[$lang] || COMPARE_LABEL.en}<span class="cmpclose" on:click={closeCompare} use:activate={closeCompare} role="button" tabindex="0">✕</span></div>
    <div class="cmpcols">
      <div class="cmpcol">
        <div class="cn">{$app.name}</div>
        <div class="cs m-{$view.score.mood}">{$view.score.s10.toFixed(1)}</div>
        <div class="ct">{tg("tags", $view.score.tagKey)}</div>
        <div class="cmeta">{$fmt.temp($view.w.feels)} · {$view.score.label} · {$fmt.speed($view.w.wind)}</div>
      </div>
      <div class="cmpvs">vs</div>
      <div class="cmpcol">
        <div class="cn">{compare.name}</div>
        <div class="cs m-{compare.score.mood}">{compare.score.s10.toFixed(1)}</div>
        <div class="ct">{tg("tags", compare.score.tagKey)}</div>
        <div class="cmeta">{$fmt.temp(compare.w.feels)} · {compare.score.label} · {$fmt.speed(compare.w.wind)}</div>
      </div>
    </div>
  </div>
{/if}

{#if copied}<div class="toast">{COPIED_LABEL[$lang] || COPIED_LABEL.en}</div>{/if}

<SearchModal bind:this={searchComp} open={searchOpen} pickMode={searchMode} on:select={onSelect} on:compare={onCompare} on:close={() => { searchOpen = false; searchMode = "select"; }} />
<Contribute open={contribOpen} on:close={() => (contribOpen = false)} />
