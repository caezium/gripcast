# Changelog

## v0.10 — Lap-time mode (mock, IAME X30 Senior)
- Tap the score to flip the hero between `X/10` and a **best theoretical lap**
  for the conditions — a far more driver-intuitive read than an abstract scale.
- Baselines are **competitive dry IAME X30 Senior** (125cc TaG) times, grounded
  where data exists (e.g. South Garda ~48.5s, reading ~48.8 on a cool dry night).
  Class is labelled in the UI so the assumption is explicit.
- Model: `lap = baseline × (1 + penalty)`, each point below 10 ≈ +0.7%, wet adds
  more; shows the gap vs ideal (`+0.3s`).
- For tracks with **no credible benchmark, it no longer fabricates a number** —
  it shows `—` and prompts for the X30 Senior baseline (editable, persisted per
  track). Mode + baseline persist; fully localised.

## v0.9 — Real jetting + tyre models (inline)
- Folded the standalone **JetLab** engine model and the **tyre-pressure**
  notebook model into GripCast's conditions drop-up, fed by the shared
  humid-air → RAD core (`airDensity`) and the track's live temp — no new screens.
- **Jetting:** pick engine (IAME X30 Jr/Sr, KA100, Mini Swift) → actual High/Low
  **needle turns** (e.g. `H 1⅛ · L 1½`) with a vs-baseline note (`⅜ leaner`),
  categorical to eighths (never false precision).
- **Tyres:** pick compound (Mojo / LeCont / Vega / MG) → recommended **cold
  pressure** in bar + psi at the current air temp (coefficient model + exact
  bar↔psi). Gay-Lussac hot↔cold helper available.
- Selections persist; replaces the earlier rough richer/leaner % and tyre arrow.

## v0.8 — Vite/Svelte migration + information design
- **P1:** migrated the single-file prototype to **Vite + TypeScript + Svelte**
  (typed `lib/`, Svelte `components/`, reactive store + derived view model) at
  full feature parity. Original kept at `legacy/gripcast.html`.
- **P2 (Dark Sky principles):** context subtag surfaces the limiting/lifting
  factor ("rain is killing grip" / "cool, dry & calm — ideal"); **wind-direction
  arrow** next to wind speed; **rain timeline** ("dry until 14:00") shown only
  when rain is in the day; categorical precip (light/moderate/heavy) over bare
  mm; **forecast-confidence fade** beyond +7 days in the trends graph.
- **P3 (karting tools):** **density-altitude + jetting guide** (relative air
  density %, richer/leaner direction vs ISA baseline, DA in metres) — turns
  weather into engine tuning; **units toggle** (°C/°F, km/h/mph, auto from
  locale); **track-temp estimate** + cold-set **tyre-pressure** nudge;
  **best session window** today from the hourly score. All in the details drop-up.
- **P4 (routing + PWA):** shareable deep links (`#/lat,lon/date?n=Name`) that
  read on load and write as you browse; "copy link" in the quick menu; installable
  **PWA** (manifest + icon) with an offline **service worker** (app shell & tiles
  cache-first, APIs network-first with cache fallback so the last conditions show
  trackside with no signal).
- **P5 (compare, alerts, a11y, explainer):** side-by-side **compare** of two
  tracks (score + conditions); **next strong day** finder from the 14-day
  forecast with an optional local **notification**; **accessibility** —
  `prefers-reduced-motion` (static clouds + damped transitions), `aria-live`
  score, keyboard-activatable controls, mood conveyed by text not colour alone;
  **plain-language explainer** (the "why" subtag under the score + in details).


The build progressed through these phases. Earlier iterations lived in a single
file that each step overwrote, so this log is the record of that evolution.

## v0.1 — Concept
- Single karting **track-day score** card driven by Open-Meteo.
- Scoring model: grip (rain/temp), lap-time pace (cold dense air), comfort.
- Background gradient keyed to the score.

## v0.2 — Sunset-style redesign
- Rebuilt the UI to match the glassy, minimal aesthetic of the sunset predictor
  that inspired it: Inter + IBM Plex Mono, full-bleed gradient, warped blurred
  cloud blobs, a particle field, and gradient-clipped "glass" score text.

## v0.3 — OpenStreetMap search
- Replaced the city-only geocoder with OSM (Nominatim) so search resolves both
  cities and named circuits; kart tracks detected and badged 🏁.

## v0.4 — Track browser
- Featured circuits + recents (localStorage), grouped suggestions, keyboard nav.

## v0.6 — Internationalization, time model & data-viz polish (current)
- **i18n:** 8 languages (en/es/fr/de/it/pt/ja/zh), auto-detected from the
  browser on first visit and saved; globe switcher (top-left). All UI chrome,
  taglines and phase labels translate live.
- **Timezone-aware time model:** clock shows the *track's* local time + tz
  abbreviation (resolves the mismatch when scoring a far-away circuit).
- **Hourly time model:** on-demand hourly fetch per day; an hour scrubber lets
  you check any hour of any day; top-right counts down to the day's next
  **peak grip window** (live), or shows the day's peak hour in history view.
- **History + trends:** past window extended to 60 days; an SVG trends chart
  (grip line + temp + precip) gives the "shape" at a glance, clickable per day.
- **Backdrop:** faster wind-driven cloud drift, heavier/visible rain, a
  temperature warm/cool sky tint, and mood-tinted score text (green→amber→steel,
  distinct wet styling).
- **Search:** themed to flip with the sky (light/dark); removed the redundant
  top search button; "near me" now lists nearby circuits with an explicit
  "my current location" option; boots to your last place; Overpass results
  cached to localStorage; map loading indicator.

## v0.5 — Full redesign
- **Search:** Photon type-ahead, results grouped **tracks-first then places**
  (collapsible), Overpass for circuits near a typed city (karting ranked first),
  `lat, lon` input, multi-mirror Overpass with race + cache for resilience.
- **Map view:** Leaflet + dark tiles, pan-to-load circuit markers.
- **Dynamic backdrop:** sky gradient from the track's local time-of-day
  (night/dawn/day/golden/dusk) blended with cloud cover + precip; auto contrast
  flip; wind-driven cloud drift; rain streaks; stars at night.
- **Weather details drop-up:** real temp + feels-like, humidity, cloud, wind,
  gusts, precip, pressure, grip/pace/comfort bars, dry-vs-wet line.
- **History + forecast timeline** scrubber (~3 weeks).
- **Quick-switch drop-up** under the track name (recents / featured / near me).
- Repurposed the top-right element into a **sunrise/sunset countdown**.
