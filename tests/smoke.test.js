// Runs the whole page script against a stand-in DOM to catch load-time errors.
// Run from anywhere: node tests/smoke.test.js  (or tests/run.sh for everything)
const path = require("path");
const PAGE = process.argv[2] || path.join(__dirname, "..", "four-tone-code.html");
const SAMPLE = process.argv[3] || path.join(__dirname, "..", "sample.txt");
const fs = require("fs");
const html = fs.readFileSync(PAGE, "utf8");
const script = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
// Minimal fake DOM: every element accepts any property or method call.
const els = {};
function fakeEl(id) {
  const kids = [];
  const target = {
    id, value: "", checked: true, disabled: false, hidden: false, textContent: "", innerHTML: "", title: "",
    dataset: {}, style: {}, children: kids, options: [], selectedOptions: [{ text: "Beginner" }],
    classList: { _s: new Set(), add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); }, contains(c) { return this._s.has(c); } },
    listeners: {},
    addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
    append(...n) { kids.push(...n); }, replaceChildren(...n) { kids.length = 0; kids.push(...n); },
    setAttribute(k, v) { this[k] = v; }, getAttribute(k) { return this[k] ?? "panel-h"; },
    querySelector() { return fakeEl("q"); }, querySelectorAll() { return []; }, closest() { return null; },
    focus() {}, scrollIntoView() {}, add(o) { this.options.push(o); },
    createCaption() { return fakeEl("cap"); }, insertRow() { return fakeEl("row"); }, insertCell() { return fakeEl("cell"); },
  };
  return target;
}
const defaults = { preset: "beginner", tone: "250", gapIn: "80", gapSym: "600", program: "73", soundSet: "fifths", text: "Hello World 2026", lSpeed: "encode", lSet: "encode", qPool: "letters" };
global.document = {
  getElementById: id => (els[id] ||= Object.assign(fakeEl(id), { value: defaults[id] ?? "" })),
  createElement: t => fakeEl(t), createRange: () => ({ selectNodeContents() {} }),
  querySelectorAll: sel => sel === ".panel" ? ["enc-h", "dec-h"].map(h => Object.assign(fakeEl("p"), { getAttribute: () => h })) : [],
  body: fakeEl("body"),
};
global.window = global; global.localStorage = { getItem: () => null, setItem() {} };
global.requestAnimationFrame = () => 0; global.cancelAnimationFrame = () => {}; global.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
global.Option = function (text, value) { this.text = text; this.value = value; };
global.navigator = {};
try {
  eval(script);
  const fire = (id, type) => (els[id].listeners[type] || []).forEach(f => f({ target: els[id], preventDefault() {} }));
  for (const set of ["chord", "fifths"]) {
    els.soundSet.value = set; fire("soundSet", "change");
    console.log(set.padEnd(12), "| chips:", els.pitches.children.length, "| strip:", els.strip.children.length, "| codes:", els.codes.textContent.slice(0, 30),
      "| instrument disabled:", els.program.disabled, "| mode help:", els.modeHelp.textContent.slice(0, 40), "| start:", els.lStart.textContent);
  }
  els.lSet.value = "chord"; fire("lSet", "change"); console.log("listen info:", els.lInfo.textContent);
  console.log("SMOKE OK");
} catch (e) { console.log("ERROR:", e.stack.split("\n").slice(0, 4).join("\n")); process.exitCode = 1; }
