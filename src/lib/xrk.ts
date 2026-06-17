// Minimal client-side AiM .xrk decoder — ported faithfully from tools/01_extract_laps.py.
// Chunks are framed as bytes 0x3c 0x68 ("<h") + a 3-byte tag, a 12-byte header, then
// `size` bytes of payload (size = uint32 LE at header+6, payload at header+12).
//   LAP payload: lap time in ms is an int32 LE at payload offset 4.
//   TMD / TMT  : NUL-terminated latin1 strings (session date / time).
// Runs entirely in the browser on an ArrayBuffer — no upload required to preview laps.

export interface XrkParse {
  date: string;
  time: string;
  laps: number[]; // seconds, in file order
  best: number | null; // fastest plausible flying lap (s)
}

function findPattern(buf: Uint8Array, pat: Uint8Array, from: number): number {
  const end = buf.length - pat.length;
  outer: for (let i = from; i <= end; i++) {
    for (let k = 0; k < pat.length; k++) if (buf[i + k] !== pat[k]) continue outer;
    return i;
  }
  return -1;
}

function chunks(buf: Uint8Array, dv: DataView, tag: string): Uint8Array[] {
  const pat = new Uint8Array(2 + tag.length);
  pat[0] = 0x3c;
  pat[1] = 0x68;
  for (let i = 0; i < tag.length; i++) pat[2 + i] = tag.charCodeAt(i);
  const out: Uint8Array[] = [];
  let i = 0;
  for (;;) {
    const j = findPattern(buf, pat, i);
    if (j < 0) break;
    if (j + 12 <= buf.length) {
      const size = dv.getUint32(j + 6, true);
      const start = j + 12;
      const stop = Math.min(start + size, buf.length);
      out.push(buf.subarray(start, stop));
    }
    i = j + 2; // mirror the Python scan step
  }
  return out;
}

function cstr(b: Uint8Array): string {
  let end = b.indexOf(0);
  if (end < 0) end = b.length;
  let s = "";
  for (let i = 0; i < end; i++) s += String.fromCharCode(b[i]); // latin1
  return s.trim();
}

export function parseXrk(ab: ArrayBuffer): XrkParse {
  const buf = new Uint8Array(ab);
  const dv = new DataView(ab);
  const tmd = chunks(buf, dv, "TMD");
  const tmt = chunks(buf, dv, "TMT");
  const date = tmd.length ? cstr(tmd[0]) : "";
  const time = tmt.length ? cstr(tmt[0]) : "";

  const laps: number[] = [];
  for (const pl of chunks(buf, dv, "LAP")) {
    if (pl.length < 8) continue;
    const dvp = new DataView(pl.buffer, pl.byteOffset, pl.length);
    const ms = dvp.getInt32(4, true);
    const s = Math.round(ms) / 1000;
    if (s > 0) laps.push(Math.round(s * 1000) / 1000);
  }
  // a kart flying lap is realistically 15–180 s; ignore out/in-laps & garbage for "best"
  const flying = laps.filter((x) => x >= 15 && x <= 180);
  const best = flying.length ? Math.min(...flying) : null;
  return { date, time, laps, best };
}
