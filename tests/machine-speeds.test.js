// 32x and 64x decode exactly from MIDI, with and without the file's timing info.
// Run from anywhere: node tests/machine-speeds.test.js  (or tests/run.sh for everything)
const path = require("path");
const PAGE = process.argv[2] || path.join(__dirname, "..", "four-tone-code.html");
const SAMPLE = process.argv[3] || path.join(__dirname, "..", "sample.txt");
const fs = require("fs");
const src = fs.readFileSync(PAGE, "utf8");
eval(src.slice(src.indexOf("  const hz = "), src.indexOf("  // ---------- ZIP")) + "; Object.assign(globalThis, {encodeText, buildMidi, parseMidi, decodeNotes, PRESETS});");
const text = fs.readFileSync(SAMPLE, "utf8").replace(/\n$/, "");
for (const fixed of [true, false]) for (const sp of ["x32", "x64"]) {
  const notes = parseMidi(buildMidi(encodeText(text, { fixed }).symbols, PRESETS[sp], 0, "fifths", fixed));
  const ok = t => t === text ? "ok" : (process.exitCode = 1, "FAIL");
  const bare = Object.assign(notes.map(n => ({ ...n })), { timing: null, setKey: null, fixed, program: 0 });
  console.log(sp, PRESETS[sp].join("/"), fixed ? "3-only" : "mixed", "MIDI:", ok(decodeNotes(notes).chars.map(c => c.ch).join("")), "| without timing info:", ok(decodeNotes(bare).chars.map(c => c.ch).join("")));
}
