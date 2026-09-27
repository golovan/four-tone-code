# Four-Tone Code

Turn text into short tones, each one of four pitches, and back again. A message can be sent
as sound and read back by ear with the codebook as notes, or decoded by the tool from a MIDI
file, a recording or live sound.

**Try it:** open [`four-tone-code.html`](four-tone-code.html) in Chrome, Edge or Firefox, or use
the hosted page (GitHub Pages). It's a single file with no build step.

**Read the guide:** [Four-Tone-Code-Guide.pdf](Four-Tone-Code-Guide.pdf) explains the theory
behind the code and how to use the tool, and ends with a one-page reference card.

## The code in short

- Four pitches: A3 E4 B4 F♯5, a stack of fifths. Do–mi–sol–do' is an alternative set.
- Each character is three tones. The 1st tone picks the table, the 2nd the row, the 3rd the
  column, so H = 1 2 4.
- The 64 three-tone codes cover letters, digits, space, punctuation and the keys Shift,
  Caps Lock, Enter and End of message. With Shift, that's every character on a US keyboard.
- Optional short codes give the most common characters 1 or 2 tones, for faster messages.
- Speeds run from Beginner to 16× by ear. MIDI files work up to 64×.
- Messages save as `.mid`, `.zip` or `.mp3`. File names carry the settings, so recordings
  decode without guessing.

## Tests

```sh
tests/run.sh
```

This runs the offline tests with Node:
- a syntax check;
- a smoke test of the whole page script;
- zip round trips;
- MIDI round trips at every speed;
- synthetic audio through the live decoder.

It prints `ALL TESTS PASSED` when everything passes.

The guide's source is [`docs/guide.html`](docs/guide.html). To rebuild the PDF, print it with
headless Chrome (`--print-to-pdf`).
