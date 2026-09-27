// Zip download: compresses, reads back with the page's own unzip, decodes.
// Run from anywhere: node tests/zip.test.js  (or tests/run.sh for everything)
const path = require("path");
const PAGE = process.argv[2] || path.join(__dirname, "..", "four-tone-code.html");
const SAMPLE = process.argv[3] || path.join(__dirname, "..", "sample.txt");
const fs = require("fs");
globalThis.window = globalThis;
const src = fs.readFileSync(PAGE, "utf8");
const code = src.slice(src.indexOf("  const hz = "), src.indexOf("  // ---------- audio ----------"));
eval(code + "; Object.assign(globalThis, {encodeText, buildMidi, parseMidi, decodeNotes, PRESETS, makeZip, fileFromZip});");
(async () => {
  const texts = { hello: "Hello World 2026", christie: fs.readFileSync(SAMPLE, "utf8").replace(/\n$/, "") };
  for (const [name, text] of Object.entries(texts)) {
    const midi = buildMidi(encodeText(text, { end: true }).symbols, PRESETS.beginner, 73);
    const zip = await makeZip(name + ".mid", midi);
    const back = await fileFromZip(zip);
    const same = back.bytes.length === midi.length && back.bytes.every((b, i) => b === midi[i]);
    const decoded = decodeNotes(parseMidi(back.bytes)).chars.map(c => c.ch).join("") === text;
    fs.writeFileSync(path.join(require("os").tmpdir(), `four-tone-${name}.zip`), zip);
    if (!same || !decoded) process.exitCode = 1;
    console.log(`${name}: .mid ${midi.length} B, .zip ${zip.length} B (${(midi.length / zip.length).toFixed(1)}x smaller), method ${zip[8]}, unzip matches: ${same}, decodes: ${decoded}`);
  }
})();
