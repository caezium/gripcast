# GripCast 🏁

**Track-day conditions, anywhere.** A single-file web app that scores how good
conditions are for karting at any circuit or location — grip, lap-time pace and
comfort rolled into one `X/10`, wrapped in a live, time-of-day sky.

Inspired by the aesthetic of Kathy Zhou's sunset predictor, rebuilt for motorsport.

![score](https://img.shields.io/badge/score-0--10-blue) ![single file](https://img.shields.io/badge/build-single%20HTML%20file-green)

## Features

- **Track-day score (0–10)** — blends track grip (rain/temp dominant), lap-time
  pace (cold dense air = fast) and comfort into one number, with a tagline
  (`send it`, `grip city`, `wet line`, …) and a plain-language "why".
- **Density-altitude + jetting guide** — relative air density %, richer/leaner
  direction vs ISA baseline, and density altitude — turns the weather into
  2-stroke engine tuning. Plus track-temp estimate, tyre-pressure nudge and the
  **best session window** today.
- **Dynamic sky backdrop** — gradient follows the *track's local time*
  (night/dawn/day/golden/dusk), tinted by cloud, rain and temperature. Contrast
  flips automatically; clouds drift faster in wind; rain streaks; stars at night.
- **Information design** — context subtag surfaces the limiting factor, a rain
  timeline ("dry until 14:00"), wind-direction arrow, categorical precip, and a
  forecast-confidence fade on the trends graph.
- **Weather details drop-up** — real temp + feels-like, humidity, cloud, wind,
  gusts, precip, pressure, a grip/pace/comfort breakdown and dry-vs-wet line.
- **Search** — type-ahead (Photon/OSM), grouped tracks-first then places (both
  collapsible), kart circuits ranked first; accepts `lat, lon`; plus a **map view**.
- **History & forecast** — 60-day timeline + an SVG trends chart; an **hour
  scrubber** to check any hour of any day; **next strong day** finder + notify.
- **Compare** two tracks side by side · **shareable deep links** · **8 languages**
  (auto + saved) · **°C/°F & km/h/mph** · installable **PWA, works offline**.
- **Quick switch** — click the track name for recents, featured, near-me, share.
- **Countdown** — time to the day's next **peak-grip** window.

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
