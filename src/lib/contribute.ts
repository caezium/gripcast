// Lap-data contribution: a small share-preference store (default on, opt-out) and
// the uploader that posts a contribution to the GripCast collection Worker.
//
// Sharing is ON by default and disclosed at the point of upload (see Contribute.svelte),
// with the opt-out toggle shown right there. If the user opts out, parsing still runs
// locally so they get their own laps back, but nothing is transmitted.

import { writable } from "svelte/store";

const SHARE_KEY = "gc_share";

function initShare(): boolean {
  try {
    return localStorage.getItem(SHARE_KEY) !== "0";
  } catch {
    return true;
  }
}

/** true = contribute uploads to the shared model (default). false = keep local only. */
export const shareData = writable<boolean>(initShare());
shareData.subscribe((v) => {
  try {
    localStorage.setItem(SHARE_KEY, v ? "1" : "0");
  } catch {}
});

/** Collection endpoint (the Worker). Empty until configured via VITE_CONTRIBUTE_URL. */
export const CONTRIBUTE_URL: string = (import.meta.env.VITE_CONTRIBUTE_URL || "").replace(/\/$/, "");

export interface ContribMeta {
  track: string;
  lat: number | null;
  lon: number | null;
  klass: string;
  handle: string;
  date: string;
  time: string;
  nLaps: number;
  best: number | null;
  laps: number[];
}

export interface ContribResult {
  ok: boolean;
  skipped?: boolean; // no endpoint configured
  error?: string;
}

export async function uploadContribution(meta: ContribMeta, file: File | null): Promise<ContribResult> {
  if (!CONTRIBUTE_URL) return { ok: false, skipped: true };
  try {
    const fd = new FormData();
    fd.append("meta", JSON.stringify(meta));
    if (file) fd.append("file", file, file.name);
    const r = await fetch(CONTRIBUTE_URL + "/contribute", { method: "POST", body: fd });
    if (!r.ok) return { ok: false, error: "HTTP " + r.status };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}
