# Personal-calibration pipeline (Shenzhen Xtreme Speedway)

How `src/lib/personal.ts` was derived from the driver's AiM `.xrk` telemetry.
Run from `~/Desktop/xrk` containing the `*XTreme*.xrk` session files.

1. **`01_extract_laps.py`** — parse the AiM XRK binary (chunked `<hLAP`/`<hTMD`/`<hTMT`).
   Each `LAP` chunk's 2nd uint32 is the lap time in ms; `TMD`/`TMT` give the
   session date/time. → `/tmp/xrk_sessions.json`.
2. **`02_pair_weather.py`** — fetch ERA5 historical hourly weather (Open-Meteo
   archive) for each session's date+hour at the track, run the GripCast scoring
   to get grip/score. → `/tmp/shenzhen_data.json`.
3. **`03_fit_model.py`** — robust lower-envelope fit of the dry "personal limit"
   over time (drops off-days), validates the wet penalty vs the physics step,
   emits the compact dataset embedded in `src/lib/personal.ts`.

Findings: dry limit 44.99s (Mar 30) → ~43.0s now, improving ~0.34 s/week; PB
42.47s; real-rain laps ~+10% (matching the √grip + wet-step model).
