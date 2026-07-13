---
slug: the-generative-workflow
title: "The generative ai workflow, minus the mystery"
tag: Language
date: 2026-07-11
description: "Strip the buzzword and a generative ai workflow is three things: inputs you name, a model step, and effects you can point to. Declare all three in one file and the mystery evaporates. Rehearsed offline, every asset with provenance."
---

A generative ai workflow, with the buzzword stripped, is three things: **inputs you name**, **a model step**, and **effects you can point to**, meaning files that exist afterward and didn't before. Every image pipeline, every audio pack, every "brief to assets" product flow reduces to that triple. The mystery lives entirely in how those three usually stay *implicit*: the inputs buried in a notebook, the model step wrapped in a vendor helper script, the effects scattered wherever the SDK felt like writing.

Declare the triple instead. This workflow came from the engine's own skeleton, `nika new --from media-asset-pack`, whose header states the house rule: *"Native-first · generation is `nika:image_generate` (no provider curl · no OpenAI helper script)"*. Filled, it reads:

```yaml landing-hero-pack.nika.yaml
nika: v1
workflow: landing-hero-pack
description: "One brief, one rendered hero, one manifest naming what landed where"

model: ollama/llama3.2:3b

permits:
  fs:
    write: ["./out/assets/**"]
  exec: false
  tools: ["nika:image_generate", "nika:jq", "nika:write"]

vars:
  subject: "a calm cosmic landing hero"
  out_dir: "./out/assets"

tasks:
  - id: brief
    infer:
      max_tokens: 600
      prompt: |
        Write one vivid, concrete image prompt for: ${{ vars.subject }}.
        No text in the image · no watermark · a calm central zone.
      schema:
        type: object
        additionalProperties: false
        properties:
          image_prompt: { type: string }
        required: [image_prompt]

  - id: render
    depends_on: [brief]
    invoke:
      tool: "nika:image_generate"
      args:
        provider: mock
        prompt: "${{ tasks.brief.output.image_prompt }}"
        output_dir: "${{ vars.out_dir }}"
        filename_prefix: "hero"

  - id: manifest
    depends_on: [brief, render]
    invoke:
      tool: "nika:jq"
      args:
        expression: "{ brief: .[0], images: .[1].images }"
        input:
          - "${{ tasks.brief.output }}"
          - "${{ tasks.render.output }}"

  - id: persist
    depends_on: [manifest]
    invoke:
      tool: "nika:write"
      args:
        path: "${{ vars.out_dir }}/manifest.json"
        create_dirs: true
        content: "${{ tasks.manifest.output }}"

outputs:
  manifest: ${{ tasks.manifest.output }}
```

The triple, made explicit: `vars:` is the input surface, and changing the subject moves nothing else. The `brief` is the model step, schema-typed so the prompt it writes is a value, not vibes. And the effects are *declared before they happen*: `permits.fs.write` says assets land under `./out/assets/**` and nowhere else. That last line taught me something while writing this. I first asked the audit to infer the boundary for me, and it refused, correctly: *"task `render` uses a dynamic path — `fs` cannot express 'any path'; add the resolved path(s) before running."* The tool would not guess my blast radius. I had to write it down. That is the review working on the *author*.

Then the run. Here is the part that separates a declared pipeline from a vendor script: the render step **narrates itself**.

```text
❯ nika run landing-hero-pack.nika.yaml

  ✔  brief     infer · ollama/llama3.2:3b  2m23s
nika:emit [image_generation.started]  {"mode":"generate","model":"mock-image-1","n":1,"provider":"mock"}
nika:emit [image_generation.decoded]  {"height":256,"index":0,"mime_type":"image/png","size_bytes":196947,"width":256}
nika:emit [image_generation.saved]    {"path":"./out/assets/hero-mock-mock-image-1-0-03ae7c86.png","sha256_8":"03ae7c86"}
nika:emit [image_generation.completed] {"cost_usd":null,"count":1,"duration_ms":18,"total_bytes":197419}
  ✔  render    invoke · nika:image_generate  18ms
  ✔  manifest  invoke · nika:jq  10ms
  ✔  persist   invoke · nika:write  6ms
  ── 4/4 done · ≥ $0.00 (1 unpriced) · elapsed 143.8s ────────────
```

Read the filename the `saved` event printed: the asset's own sha256 prefix is *in its name*, and the manifest that lands next to it carries the full record of provider, model, dimensions, byte size, and the complete hash:

```json
"images": [{
  "filename": "hero-mock-mock-image-1-0-03ae7c86.png",
  "provider": "mock", "model": "mock-image-1",
  "width": 256, "height": 256, "size_bytes": 197419,
  "sha256": "03ae7c864a55591fe1a79d0a4c8df5e761a6add701bd4cdfb82ba80834d6785f"
}]
```

Every generated asset ships with its provenance, the way [the run itself ships with a verifiable trace](/blog/the-chain-of-custody). Six months from now, "which model made this hero image, from what brief?" is a lookup, not an archaeology dig. [Media are workflow citizens](/blog/media-are-workflow-citizens): assets land on disk with names and hashes, never inline blobs pasted between scripts.

And notice which provider ran: `mock`. The whole pipeline (brief, render, manifest, persist) rehearsed end to end, offline, for $0.00, on a laptop. That is what `provider: mock` is *for*: the generative workflow's shape, boundary and manifest are all real; only the pixels are placeholders. When it is time for real pixels, the swap is the one line the [pipeline post](/blog/the-pipeline-is-a-file) promised, `provider: openai` or `gemini`, and nothing else changes: same boundary, same manifest, same provenance, now with a real `cost_usd` in the completed event instead of `null`.

That is the whole demystification. Not a platform, not a "creative AI stack": a file where the inputs have names, the model step has a schema, and the effects have an address you approved in advance. Generation was never the mysterious part. The missing part was always just: *write the three things down.*
