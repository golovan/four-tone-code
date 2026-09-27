// MIDI round trips (both modes, both pitch sets) and synthetic audio through the live decoder, Beginner to 16x.
// Run from anywhere: node tests/roundtrip.test.js  (or tests/run.sh for everything)
const path = require("path");
const PAGE = process.argv[2] || path.join(__dirname, "..", "four-tone-code.html");
const SAMPLE = process.argv[3] || path.join(__dirname, "..", "sample.txt");
const fs = require("fs");
const src = fs.readFileSync(PAGE, "utf8");
const pure = src.slice(src.indexOf("  const hz = "), src.indexOf("  // ---------- ZIP"));
const dec = src.slice(src.indexOf("  // Streaming tone decoder."), src.indexOf("  // ---------- decode: one section, three sources"));
eval(pure + dec + "; Object.assign(globalThis, {encodeText, buildMidi, parseMidi, decodeNotes, ToneDecoder, Typist, PRESETS, SOUND_SETS, hz, soundSet, LONG, CTRL, SHIFT_BASE, DEC});");
const christie = fs.readFileSync(SAMPLE, "utf8").replace(/\n$/, "");
let ascii = ""; for (let c = 32; c < 127; c++) ascii += String.fromCharCode(c);
const texts = { mixed: "Hello WORLD iPhone NASA's\nsnake_case ~^| {a<b>} R&D", ascii, christie };
let fails = 0;
const codes3 = Object.keys(DEC).filter(c => c.length === 3).concat(Object.keys(CTRL).filter(c => c.length === 3));
console.log("3-tone codes used:", new Set(codes3).size, "of 64 | Shift-only:", Object.keys(SHIFT_BASE).join(" "));
for (const setKey of Object.keys(SOUND_SETS)) for (const fixed of [false, true]) {
  const row = [];
  for (const [name, text] of Object.entries(texts)) {
    const { symbols, skipped } = encodeText(text, { end: true, fixed });
    const notes = parseMidi(buildMidi(symbols, PRESETS.practiced, 73, setKey, fixed));
    const got = decodeNotes(notes).chars.map(c => c.ch).join("");
    const bare = Object.assign(notes.map(n => ({ ...n })), { setKey: null, timing: null, fixed: false, program: notes.program });
    const gotBare = decodeNotes(bare).chars.map(c => c.ch).join("");
    const allThree = !fixed || symbols.every(s => s.code.length === 3);
    const ok = got === text && gotBare === text && allThree && !skipped.size && notes.fixed === fixed;
    if (!ok) fails++;
    row.push(`${name}:${ok ? "ok" : `FAIL(${got === text}/${gotBare === text}/${allThree}/${[...skipped].join("")})`}`);
  }
  console.log(`midi  ${setKey.padEnd(6)} ${fixed ? "3-only" : "mixed "} ${row.join("  ")}`);
}
for (const fixed of [false, true]) {
  const sy = encodeText(christie, { fixed }).symbols, tones = sy.reduce((a, s) => a + s.code.length, 0);
  const secs = sp => sy.reduce((a, s) => a + s.code.length * PRESETS[sp][0] + (s.code.length - 1) * PRESETS[sp][1] + PRESETS[sp][2], 0) / 1000;
  console.log(`${fixed ? "3 tones only" : "1 to 3 tones"}: ${(tones / [...christie].length).toFixed(2)} tones/char, Practiced ${(secs("practiced") / 60).toFixed(1)} min, Beginner ${(secs("beginner") / 60).toFixed(1)} min`);
}
// synthetic audio, both modes, through the live decoder + typist
const SR = 48000;
function biquad(f, Q, sr) { const w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al;
  const B0 = (1 + cw) / 2 / a0, B1 = -(1 + cw) / a0, B2 = B0, A1 = -2 * cw / a0, A2 = (1 - al) / a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return x => { const y = B0 * x + B1 * x1 + B2 * x2 - A1 * y1 - A2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }; }
function synth(setKey, symbols, [tone, gapIn, gapSym], phone) {
  const parts = [], set = soundSet(setKey); let rnd = 7;
  const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647 - 0.5);
  const sil = ms => parts.push(new Float32Array(Math.round(ms * SR / 1000)));
  sil(200);
  for (const s of symbols) [...s.code].forEach((d, k) => {
    const f = hz(set.notes[d - 1]), n = Math.round(tone * SR / 1000), w = new Float32Array(n);
    for (let i = 0; i < n; i++) { const ph = 2 * Math.PI * f * i / SR, env = Math.min(1, i / (SR * 0.002), (n - i) / (SR * 0.002)); w[i] = 0.8 * env * [1, 2, 3, 4].reduce((a, h) => a + Math.sin(ph * h) / h, 0) * 0.6; }
    parts.push(w); sil(k < s.code.length - 1 ? gapIn : gapSym);
  });
  sil(300);
  const x = new Float32Array(parts.reduce((a, p) => a + p.length, 0)); let o = 0; for (const p of parts) { x.set(p, o); o += p.length; }
  const hp = biquad(400, 0.7, SR);
  for (let i = 0; i < x.length; i++) { let v = 0.3 * x[i]; if (phone) v = hp(v) * 1.5; x[i] = v + 0.015 * r(); }
  return x;
}
const lev = (a, b) => { a = [...a]; b = [...b]; let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[b.length]; };
const text = christie.slice(0, 300);
for (const [setKey, phone] of [["fifths", false], ["chord", false], ["chord", true]]) for (const fixed of [false, true]) {
  const row = [];
  for (const sp of ["beginner", "practiced", "x2", "x4", "x8", "x16"]) {
    const t = PRESETS[sp], { symbols } = encodeText(text, { fixed });
    const x = synth(setKey, symbols, t, phone), typist = new Typist({ fixed });
    let got = "";
    const d = new ToneDecoder(SR, t, { code: c => (got += typist.push(c).ch) }, setKey);
    for (let i = 0; i < x.length; i += 2048) d.feed(x.subarray(i, i + 2048));
    d.finish();
    const e = lev(got, text); if (e && sp !== "x16") fails++;
    row.push(`${sp}:${e ? e + "err" : "ok"}`);
  }
  console.log(`audio ${(setKey + (phone ? "+phone" : "")).padEnd(12)} ${fixed ? "3-only" : "mixed "} ${row.join("  ")}`);
}
console.log(fails ? `${fails} FAILURES` : "ALL PASSED");
if (fails) process.exitCode = 1;
