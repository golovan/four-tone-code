#!/bin/sh
# Makes ftc-debug.html: identical to four-tone-code.html except that saveLocal keeps each
# generated file in window.__saved instead of downloading it, so browser tests can read
# MIDI/zip/MP3 output. Delete ftc-debug.html when done.
cd "$(dirname "$0")/../.." || exit 1
python3 - <<'PY'
s = open("four-tone-code.html").read()
old = "  function saveLocal(bytes, filename, type) {\n"
assert s.count(old) == 1, "saveLocal not found"
s = s.replace(old, old + "    window.__saved = { bytes: new Uint8Array(bytes), filename, type }; return;\n")
open("ftc-debug.html", "w").write(s)
print("wrote ftc-debug.html")
PY
