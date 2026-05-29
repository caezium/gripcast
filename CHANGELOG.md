# Changelog

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
