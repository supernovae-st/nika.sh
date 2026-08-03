# VERIFY — this evidence pack

Everything here checks offline, from this directory. Three commands:

## 1 · the journal's tamper-evidence chain

    nika trace verify journal.ndjson

Recomputes the sha256 chain over every line. `OK` = no line edited,
inserted, dropped or reordered since the run wrote it. Compare the
printed head with `pack.json → trace.head` — and, stronger, with the
`chain <head>` the run printed when it finished (CI log · scrollback):
a head you saved out-of-band is the one anchor a whole-file rewrite
cannot reproduce.

## 2 · the seal — ABSENT on this journal

This journal is NOT sealed (`seal.present: false`). The chain is
tamper-EVIDENT only: it catches edits, but nothing attributes the file
to a key — anyone with write access could rewrite the whole journal and
re-chain it. `nika key init` on the machine that runs the workflows
mints the key every future run seals with.

## 3 · read the manifest

    cat pack.json

Every claim names its provenance (`source: journal|seal|file`). A
`null` field is an honest unknown — the matching entry in
`unavailable` says why (usually: pass `--workflow <file>` so the pack
can hash-check the workflow against the journal and re-derive the
boundary, the trifecta verdict and the receipt).

## What each tier means

- **unchained** — a pre-0.96 journal: nothing to verify, nothing to
  distrust.
- **chained** — tamper-EVIDENT: edits show. A whole-file rewrite does
  not — only the out-of-band head catches that.
- **sealed** — chained + attributable: forging the journal needs the
  run key, not just write access to the file.
- **anchored** — sealed + the head matches one you saved elsewhere.
