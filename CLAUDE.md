# Four-Tone Code

A single-page tool (`four-tone-code.html`, no build step) that turns text into short tones
(one of four pitches each), so a person can decode by ear with the codebook as notes.
It plays the code, saves it as MIDI / zip / MP3, and decodes MIDI files, recordings,
the microphone, or the page's own playback back into text.

- Published as a private claude.ai artifact: https://claude.ai/artifact/F5Z2nbbBbYnFfdmkSr8BGy
  (declares the `downloads` capability).
- `sample.txt` is the user's saved copy of the 1,000-character test passage; don't modify it.

## Working with the user
- Iterative UI work. For layout or design choices, propose 2–3 options (AskUserQuestion with
  previews) and let them pick; they often choose the recommended one.
- No backwards compatibility needed: code layouts and file formats may change freely.
- UI text: clear and concrete, minimal explanation.
- Verify before reporting: run the tests below, and check real behaviour in the browser pane.
  Report numbers, and say what wasn't tested (e.g. real microphone, the published page's
  downloads).
- After changing the page, republish the artifact (keep the same URL).

## The code
- **Pitch sets:** Fifths A3 E4 B4 F♯5 (MIDI 57 64 71 78, default), or Do–mi–sol–do' C4 E4 G4 C5
  (60 64 67 72). The octave set needs the decoder's octave rule (see below).
- **"3 tones only" (default on):** every character and key is 3 tones. When it's off,
  short codes are added on top of the same 3-tone table, so 3-tone messages decode in both modes.
- **Short codes (1 to 3 tones mode):**
  - 1 tone: `1` space, `2` e, `3` t, `4` a.
  - 2 tones: `11` o, `12` i, `13` n, `14` s, `21` h, `22` r, `23` d, `24` l, `31` c, `32` u,
    `33` m, `34` w; `41` ⇧ Shift, `42` ⇪ Caps Lock, `43` ↵ Enter, `44` ∎ End.
- **3-tone table.** The 1st tone picks the table, the 2nd the row, the 3rd the column; H = 124.
  - 1xx: A–P.
  - 2xx: Q–X, then `Y Z ␣ .` and `, ? ! '`.
  - 3xx: 0–7, then `8 9 + -` and `* / = %`.
  - 4xx: `( ) [ ]`, `" : ; \``, `@ # $ \`, and the keys ⇧ ⇪ ↵ ∎ at 441–444.
- **Letters and Shift:** letters default to lowercase. Shift works as on a US keyboard, and
  only `^ & ~ _ { } | < >` need it (⇧ 6, 7, `, -, [, ], \, ",", ".").
- **Case in the encoder:** a single capital gets Shift; a run of capitals gets Caps Lock.
  End resets Caps Lock.
- **Speeds (tone / gap in a symbol / gap between symbols, ms):**
  - Beginner 250/80/600; Practiced 150/50/350 (default).
  - 2× 4× 8× 16× 32× 64× halve Practiced; 64× is 2/1/5.
  - 16× is the limit of hearing. 32× and 64× only work through MIDI.
- **Instruments:** only the six that decode a 16× MP3 without errors: Piano (default), Flute,
  Glockenspiel, Marimba, Organ, Pure tone. Harpsichord, guitar, violin, trumpet, clarinet,
  square and sawtooth were removed for errors at 16× MP3.

## Files the page makes
- **MIDI:** format 0, 500 ticks per quarter at tempo 500000, so 1 tick = 1 ms. Channel 1.
  A text meta event `four-tone-code set=<fifths|chord>[ len=3] tone=<ms> in=<ms> gap=<ms>`
  lets decoding skip guessing. Reading ignores the drum channel.
- **Names:** `<text-slug>_<set>_<preset>-<tone>-<gapIn>-<gapSym>ms_<instrument>[_3tones][_end]`.
  Decode reads the settings back from a recording's name.
- **Zip:** one file, deflate via CompressionStream. MIDI shrinks about 12×.
- **MP3:** lamejs 1.2.1 from cdnjs, loaded on first use. 64 kbps mono, rendered offline in
  ~20 s slices cut at note starts.
- **Published page:** can only save .zip (the downloads allowlist has no .mid or .mp3), so
  .mid and .mp3 are offered inside a zip there. The local file saves them directly.

## Page layout and defaults
- Compact header (title and tagline left, the four pitch buttons right), full window width.
- Encode and Decode side by side and the same height. Below them Codebook, then Practice.
- Codebook and Practice start folded. Fold state is kept in localStorage under `fold3:<id>`;
  bump the prefix to reset everyone's folds.
- Decode is one section with sources File / Microphone / This page. File accepts
  .mid / .zip / recordings. Its Pitch set / Speed / Code length default to "As Encode"; a
  MIDI file locks them, and switching away from File resets file-derived values.
- Copy and Clear are icon buttons in a box's top-right corner.
- Default text: "Four pitches, 64 codes. Listen closely!". "End of message" is unchecked.

## Decoder (ToneDecoder) lessons, all hard-won
- Tones are found with a 1.5 ms RMS envelope. Pitch comes from Goertzel filters on the
  four notes.
- Symbols are split by time since the last accepted tone start, not by silence length.
  Noise blips don't restart that clock.
- The first 150 ms only learn the noise floor.
- A tone ends below 15% of its own peak, as well as below the global thresholds.
- Octave rule for do–mi–sol–do': if C5 wins but C4 has >35% of C5's energy, it's C4. Small
  speakers make C4's overtone louder than C4 itself.
- Merged tones (MP3 smear, echo): only when a sound lasts ≥1.6 tone units is it split, by
  length (2 or 3 tones), with the pitch-change runs saying which. The first
  (window − gap) ms of votes are skipped, because the Goertzel window still hears the
  previous tone.
- Playback: each note's fade-out must finish inside the gap before the next note
  (release ≤ gap/6).
- Notes are scheduled about 2 s ahead in batches. Building thousands of nodes at once
  froze the page, and the ScriptProcessor-based live decoder lost audio.

## Editing and publishing
- `four-tone-code.html` in this folder is the only source. It has a doctype/head/body wrapper
  (the first 6 lines, plus the `</head>`, `<body>`, `</body>`, `</html>` lines) that the
  artifact must not contain.
- To publish:
  1. Write a stripped copy to the session scratchpad:
     `sed -e '1,6d' -e '/^<\/head>$/d' -e '/^<body>$/d' -e '/^<\/body>$/d' -e '/^<\/html>$/d' four-tone-code.html > <scratchpad>/four-tone-code.html`
  2. Publish it with the Artifact tool. In a new conversation, first `read` the artifact URL
     above, then publish with `url` set, so it updates in place.

## Testing
- **Run everything offline:** `tests/run.sh`. It prints "ALL TESTS PASSED" and exits
  non-zero on any failure. It covers:
  - the syntax check;
  - `tests/smoke.test.js`: a stand-in DOM smoke test;
  - `tests/zip.test.js`;
  - `tests/machine-speeds.test.js`: 32× and 64× through MIDI;
  - `tests/roundtrip.test.js`: MIDI and synthetic audio, both modes and both sets.
  The tests read `four-tone-code.html` and `sample.txt` from the project folder.
- **MP3 in the browser pane:** `tests/browser/make-debug-copy.sh` makes `ftc-debug.html`, and
  `tests/browser/mp3-roundtrip.js` gives the paste-in `mp3Test(preset, fixed, program)` helper.
  Instructions are at the top of that file.
- Syntax: extract the `<script>` block and run `node --check` on it.
- Logic tests in Node eval slices of the page script:
  - pure code: from `  const hz = ` to `  // ---------- ZIP`;
  - live decoder: from `  // Streaming tone decoder.` to `  // ---------- decode: one section, three sources`.
- What the tests cover:
  - MIDI round trips: all 95 ASCII characters, both modes, both sets, and with the info text
    stripped.
  - Synthetic audio (harmonic tones plus noise, plus a phone-speaker high-pass) through
    ToneDecoder at Beginner to 16×.
  - A stand-in DOM smoke test of the whole script.
- Browser pane:
  - Serve the folder with `python3 -m http.server 8765 --bind 127.0.0.1` in the background.
    `preview_start` pointed at the old scratch folder.
  - Add `?v=N` to URLs to avoid stale cached copies.
  - Audio needs one real click (e.g. on "Start listening") before scripted playback works.
  - `javascript_tool` calls time out at 45 s; split long runs.
  - Screenshots come back blank while the pane is hidden; measure the DOM instead.
- To test downloads (e.g. MP3 at 16×, then decode), use a temporary `ftc-debug.html`: a copy
  whose `saveLocal` stores the file in `window.__saved` instead of downloading. Upload it via a
  DataTransfer on `#file`, then delete the copy.
- Reference text: `sample.txt`, a 1,000-character Christie-style passage with 4 line breaks.
  A 16× MP3 of it decodes with 0 errors on all six instruments.
