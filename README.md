# GripCast 🏁

**Track-day conditions, anywhere.** A single-file web app that scores how good
conditions are for karting at any circuit or location — grip, lap-time pace and
comfort rolled into one `X/10`, wrapped in a live, time-of-day sky.

Inspired by the aesthetic of Kathy Zhou's sunset predictor, rebuilt for motorsport.

![score](https://img.shields.io/badge/score-0--10-blue) ![single file](https://img.shields.io/badge/build-single%20HTML%20file-green)

## Features

- **Track-day score (0–10)** — blends track grip (rain/temp dominant), lap-time
  pace (cold dense air = fast) and comfort into one number, with a tagline
  (`send it`, `grip city`, `wet line`, …).
- **Dynamic sky backdrop** — the gradient follows the *track's local time*
  (night / dawn / day / golden hour / dusk), tinted by cloud cover and rain.
  Text contrast flips automatically; clouds drift faster in higher wind; rain
  streaks slant with wind; stars come out at night.
- **Weather details drop-up** — real temperature *and* feels-like, humidity,
  cloud cover, wind, gusts, precip, pressure, plus a grip / pace / comfort
  breakdown and a dry-vs-wet-line comparison.
- **Track search** — type-ahead via OpenStreetMap; results grouped
  **tracks-first then places** (both collapsible), with kart circuits ranked
  above other motorsport. Accepts `lat, lon` coordinates directly.
- **Map view** — pan a dark map and kart circuits load automatically as
  markers; click one to score it.
- **History & forecast timeline** — scrub ~3 weeks of past + predicted days and
  watch the score change.
- **Quick switch** — click the track name for recents, featured circuits and
  "near me".
- **Countdown** — live countdown to the track's next sunrise / sunset.

## Data sources

All free, no API keys:

| Purpose | Source |
| --- | --- |
| Weather (current + daily, history + forecast) | [Open-Meteo](https://open-meteo.com) |
| Type-ahead geocoding | [Photon](https://photon.komoot.io) (OSM) |
| Nearby / map circuits | [Overpass API](https://overpass-api.de) (`sport=karting`, `highway=raceway`) |
| Map tiles | [CARTO dark](https://carto.com) + OpenStreetMap |

## Run it

GripCast is now a **Vite + TypeScript + Svelte** app.

```bash
npm install
npm run dev        # http://localhost:4561
npm run build      # static bundle in dist/
npm run preview    # serve the built bundle
```

The original single-file prototype is preserved at
[`legacy/gripcast.html`](legacy/gripcast.html) for reference.

### Project layout
```
src/
  lib/      score, sky, weather, geo, i18n, units, stores (typed logic)
  components/  Fx, Clouds, MapView, TrendsGraph, SearchModal
  App.svelte   orchestration + sky/clock/popups
```

## License

MIT — see [LICENSE](LICENSE).
