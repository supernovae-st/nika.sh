# model-bench · the first published receipt

The leaderboard row the plan gated on a testimonial: no receipt, no
claim. This is the receipt.

## What ran

- Artifact: `supernovae-st/model-bench@0.1.0` from the public registry,
  the PURE pinned bytes: `nika-spec@699ebb085` `examples/model-bench.nika.yaml`,
  sha256 `beb1a3e86976636453211dd95f520a89ceed5d3087633a7b7ec21dc99582d298`
  verified byte-identical before the run (the registry's own install law).
- Engine: `nika 0.107.2` (brew, SHA256SUMS-verified install).
- Date: 2026-08-03 · machine: operator dev machine, macOS arm64, ollama.
- Seats: `ollama/qwen2.5:14b` · `ollama/llama3.2:3b` · `ollama/qwen2.5:0.5b`
  (the artifact's own seats, unmodified · the 0.5b was pulled for the run).

## Cost honesty

Ceiling announced before the run: `--max-cost-usd 0.50`. Re-judged from
the journal by `nika trace verify`: **$0.000000 spent, within, agrees
with the run's PASS**. The three seats are local models: unpriced, never
free (local compute is real).

## The proof

- `table.md`: the measured output (latency from the run's clock, length
  in characters · the quality call stays with the reader).
- `evidence/`: the exported pack (`nika trace evidence`): journal.ndjson
  (chain intact · head `01d62b824090…`), pack.json (evidence_format 1 ·
  unsigned, tamper-evident chain), VERIFY.md (the auditor's three
  commands: re-verify without trusting us).

## What this is not

One run, one machine, warm-cache latencies not controlled: a WITNESS,
not a benchmark suite. The /catalog model rooms may cite it as « one
published receipt » and must keep saying « run it yourself » beside it.
