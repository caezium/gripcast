import { decode, scoreOf, type W } from "./score";

export interface Weather {
  utc_offset_seconds: number;
  timezone_abbreviation: string;
  current: any;
  daily: {
    time: string[]; sunrise: string[]; sunset: string[]; weather_code: number[];
    temperature_2m_max: number[]; temperature_2m_min: number[];
    precipitation_probability_max: number[]; precipitation_sum: number[]; wind_speed_10m_max: number[]; wind_gusts_10m_max: number[];
  };
  todayIdx: number;
}
export interface Hourly {
  time: string[]; temp: number[]; feels: number[]; precip: number[]; code: number[];
  cloud: number[]; wind: number[]; gust: number[]; humidity: number[]; pressure: number[]; dir: number[];
}

const wxCache = new Map<string, { t: number; j: Weather }>();

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const k = lat.toFixed(2) + "," + lon.toFixed(2);
  const c = wxCache.get(k);
  if (c && Date.now() - c.t < 600000) return c.j;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,is_day`
    + `&daily=sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,wind_gusts_10m_max`
    + `&past_days=60&forecast_days=14&wind_speed_unit=kmh&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather " + res.status);
  const j = (await res.json()) as Weather;
  if (!j || !j.current || !j.daily) throw new Error("weather: malformed response");
  wxCache.set(k, { t: Date.now(), j });
  return j;
}

export async function fetchHourly(lat: number, lon: number, date: string): Promise<Hourly> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,wind_direction_10m,relative_humidity_2m,surface_pressure`
    + `&start_date=${date}&end_date=${date}&wind_speed_unit=kmh&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("hourly " + res.status);
  const H = (await res.json()).hourly || {};
  return {
    time: H.time || [], temp: H.temperature_2m || [], feels: H.apparent_temperature || [], precip: H.precipitation || [],
    code: H.weather_code || [], cloud: H.cloud_cover || [], wind: H.wind_speed_10m || [], gust: H.wind_gusts_10m || [],
    humidity: H.relative_humidity_2m || [], pressure: H.surface_pressure || [], dir: H.wind_direction_10m || [],
  };
}

export function liveW(d: Weather): W {
  const c = d.current;
  return { temp: c.temperature_2m, feels: c.apparent_temperature, wind: c.wind_speed_10m, gust: c.wind_gusts_10m,
    precip: c.precipitation, code: c.weather_code, cloud: c.cloud_cover, humidity: c.relative_humidity_2m, pressure: c.surface_pressure, dir: c.wind_direction_10m };
}
export function hourW(hd: Hourly, i: number): W {
  return { temp: hd.temp[i], feels: hd.feels[i], wind: hd.wind[i], gust: hd.gust[i], precip: hd.precip[i],
    code: hd.code[i], cloud: hd.cloud[i], humidity: hd.humidity[i], pressure: hd.pressure[i], dir: hd.dir?.[i] };
}
/** coarse cloud % from WMO code (the daily API has no cloud aggregate): clear → overcast → precip */
function cloudFromCode(c: number): number {
  return c === 0 ? 5 : c === 1 ? 25 : c === 2 ? 55 : c === 3 ? 95 : 80;
}
export function dayW(d: Weather, i: number): W {
  const dl = d.daily; const tmid = (dl.temperature_2m_max[i] + dl.temperature_2m_min[i]) / 2;
  return { temp: tmid, feels: tmid, wind: dl.wind_speed_10m_max[i], gust: dl.wind_gusts_10m_max[i],
    precip: dl.precipitation_sum?.[i] ?? 0, code: dl.weather_code[i], cloud: cloudFromCode(dl.weather_code[i]) };
}
/** array index of a local hour-of-day within an hourly block (−1 if absent, e.g. the DST-skipped hour). */
export function hourIndex(hd: Hourly, hour: number): number {
  for (let i = 0; i < hd.time.length; i++) if (+hd.time[i].slice(11, 13) === hour) return i;
  return -1;
}
/** local hour-of-day (clock hour, not array index) with the highest overall score */
export function peakHour(hd: Hourly): number {
  let bh = 0, bg = -Infinity;
  for (let i = 0; i < hd.code.length; i++) {
    const g = scoreOf(hourW(hd, i)).s10;
    if (g > bg) { bg = g; bh = hd.time[i] ? +hd.time[i].slice(11, 13) : i; }
  }
  return bh;
}
