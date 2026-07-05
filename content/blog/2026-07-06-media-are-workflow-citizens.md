---
slug: media-are-workflow-citizens
title: "Media are workflow citizens"
tag: Engine
date: 2026-07-06
description: "Images and speech now render inside workflows under the same discipline as everything else: permit-gated saves, sha256 provenance, honest warnings, real cost on the ledger — and the sovereign path first."
---

Every automation platform bolted image generation on the same way: a node that calls one cloud API and drops base64 into your flow state. The file handling is your problem. The provenance is nobody's problem. The cost shows up on an invoice three weeks later.

Nika's stdlib grew two Media builtins this week — `nika:image_generate` and `nika:tts_generate` — and the point is not that they exist. It's that they had to pass the same bar as `read`, `fetch` and `exec` before they could:

```yaml
permits:
  fs: { write: ["./assets/**"] }     # saves are boundary-gated, per final path
  tools: ["nika:image_generate"]

tasks:
  - id: hero
    invoke:
      tool: "nika:image_generate"
      args:
        provider: local              # your server — or openai · gemini · xai · mock
        prompt: "OG hero — a monarch butterfly over a nebula"
        aspect_ratio: "16:9"
        output_dir: "./assets/og"
```

**Assets, not blobs.** The render lands on disk, sha256-named, with a provenance manifest beside it — resolved request, dimensions, hashes, timing, which server actually answered (`endpoint_host`), your metadata. What flows through the workflow is a *path and a hash*, never megabytes of base64 clogging task outputs and agent context. PNG renders additionally carry provenance inside the file itself, and when the provider already signed the bytes, [we preserve their signature instead](/blog/the-credentials-your-pipeline-breaks).

**Magic bytes are the authority.** The engine reads what the payload *is* — PNG header, JPEG SOF, WAV `RIFF…WAVE`, MP3 frame sync — and the saved extension follows the bytes, not the provider's label. A WAV's duration is exact header math; an MP3's duration is honestly `null` rather than a guess. A non-media payload is a hard error, not a corrupt file on your disk.

**Degradation is loud or it doesn't happen.** Providers differ: one has no seed, another ignores `n`, a third only does size *classes*. Every lossy mapping is a stable, visible warning — `seed_unsupported:`, `count_shortfall:`, `xai_size_class:`, `format_mismatch:` — and the spec says silent degradation is non-conformant. The one place we invert the pattern: an argument whose silent drop would make the *output wrong* (not just less controlled) is refused outright.

**Real spend rides the ledger.** xAI bills images in cost ticks; the engine converts them exactly and the run shows it:

```text
✔  render  invoke · nika:image_generate  5.6s · $0.02
── 1/1 done · $0.02 · elapsed 5.6s ──────────────────
```

Providers that don't report exact cost show `null` — never an estimate dressed as truth. Any tool that reports a top-level `cost_usd` is metered through the same channel `infer:` uses.

**Offline is a first-class provider.** `provider: mock` renders real, decodable, deterministic files — an actual PNG, an actual playable WAV — with zero network and zero keys. Your media pipeline runs in CI as-is; production is a one-line flip.

And the flip goes to *your* hardware first. Both builtins speak one OpenAI-compatible wire that the entire self-hosted landscape converged on — LocalAI, Ollama, stable-diffusion.cpp, SGLang, vLLM-Omni for images; LocalAI, Kokoro-FastAPI, Speaches for speech. The base URL is engine config, never workflow data, so the security model holds. That story deserves its own post: [one wire, five servers](/blog/one-wire-five-servers).

Proven the only way that counts: live renders through every cloud provider, a real MP3 spoken by `gpt-4o-mini-tts` from a script another model wrote inside the same workflow, fan-outs racing into one directory without a collision, and a local compat server asserting — server-side — that the engine sent exactly the wire it promised.

Brief in. Assets, hashes, manifests and an exact bill out. That's what a workflow citizen looks like.
