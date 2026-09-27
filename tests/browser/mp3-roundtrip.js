// Browser-pane test: make an MP3 on the page, upload it to Decode, "Decode now", count errors.
//
// 1. tests/browser/make-debug-copy.sh
// 2. python3 -m http.server 8765 --bind 127.0.0.1   (from the project folder, in the background)
// 3. Open http://127.0.0.1:8765/ftc-debug.html?v=<n>   (bump n to skip cached copies)
// 4. Paste this file into javascript_tool, then call, e.g.:
//      await mp3Test("x16", true, 0)      // speed preset, "3 tones only", instrument program
//    Each call takes ~8 s at 16x for the 1,000-character sample; javascript_tool stops at 45 s.
// 5. Delete ftc-debug.html afterwards.
window.SAMPLE = await fetch("sample.txt").then(r => r.text()).then(t => t.replace(/\n$/, ""));
const $ = id => document.getElementById(id);
const set = (id, v) => { $(id).value = v; $(id).dispatchEvent(new Event("change")); };
window.lev = (a, b) => { a = [...a]; b = [...b]; let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[b.length]; };
window.mp3Test = async (preset, fixed, program = 0, text = SAMPLE) => {
  set("preset", preset); set("program", String(program));
  $("fixed3").checked = fixed; $("fixed3").dispatchEvent(new Event("change"));
  $("text").value = text; $("text").dispatchEvent(new Event("input"));
  window.__saved = null;
  $("downloadMp3").click();
  for (let i = 0; i < 600 && !window.__saved; i++) await new Promise(r => setTimeout(r, 100));
  const mp3 = window.__saved;
  const dt = new DataTransfer(); dt.items.add(new File([mp3.bytes], mp3.filename, { type: "audio/mpeg" }));
  $("file").files = dt.files; $("file").dispatchEvent(new Event("change"));
  for (let i = 0; i < 100 && !$("source").textContent.includes(mp3.filename + " ("); i++) await new Promise(r => setTimeout(r, 100));
  $("lNow").click();
  for (let i = 0; i < 300 && !/^Decoded/.test($("lStatus").textContent); i++) await new Promise(r => setTimeout(r, 100));
  return `${preset} ${fixed ? "3-only" : "mixed"} ${$("program").selectedOptions[0].text}: ${lev($("decoded").textContent, text)} errors / ${[...text].length}`;
};
"mp3Test ready"
