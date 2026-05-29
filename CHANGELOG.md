# Changelog

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

## v0.5 — Full redesign (current)
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
