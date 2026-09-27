#!/bin/sh
# Runs every offline test for four-tone-code.html. Exits non-zero if any fails.
cd "$(dirname "$0")/.." || exit 1
status=0
echo "== syntax"
sed -n '/^<script>$/,/^<\/script>$/p' four-tone-code.html | sed '1d;$d' > "${TMPDIR:-/tmp}/four-tone-script.js"
node --check "${TMPDIR:-/tmp}/four-tone-script.js" && echo "syntax ok" || status=1
for t in smoke zip machine-speeds roundtrip; do
  echo "== $t"
  node "tests/$t.test.js" || status=1
done
[ $status -eq 0 ] && echo "ALL TESTS PASSED" || echo "SOME TESTS FAILED"
exit $status
