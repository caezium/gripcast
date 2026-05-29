import { writable, derived } from "svelte/store";

export type UnitSystem = "metric" | "imperial";

export const units = writable<UnitSystem>(
  (localStorage.getItem("gc_units") as UnitSystem) || (navigator.language.startsWith("en-US") ? "imperial" : "metric")
);
units.subscribe((u) => { try { localStorage.setItem("gc_units", u); } catch {} });
export function toggleUnits() { units.update((u) => (u === "metric" ? "imperial" : "metric")); }

const cToF = (c: number) => c * 9 / 5 + 32;
const kmhToMph = (k: number) => k * 0.621371;

/** reactive formatters — use as $fmt.temp(c), $fmt.speed(kmh) */
export const fmt = derived(units, ($u) => {
  const imp = $u === "imperial";
  return {
    system: $u,
    tUnit: imp ? "°F" : "°C",
    sUnit: imp ? "mph" : "km/h",
    temp: (c: number | null | undefined) => (c == null ? "—" : Math.round(imp ? cToF(c) : c) + "°"),
    tempU: (c: number | null | undefined) => (c == null ? "—" : Math.round(imp ? cToF(c) : c) + (imp ? "°F" : "°C")),
    speed: (k: number | null | undefined) => (k == null ? "—" : Math.round(imp ? kmhToMph(k) : k) + " " + (imp ? "mph" : "km/h")),
  };
});
