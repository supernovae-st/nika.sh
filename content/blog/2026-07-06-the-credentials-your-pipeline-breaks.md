---
slug: the-credentials-your-pipeline-breaks
title: "The credentials your pipeline was breaking"
tag: Security
date: 2026-07-06
description: "OpenAI and Google sign the images their APIs return. Almost every pipeline that touches those files silently converts the signature into evidence of tampering. That included ours, until this week."
---

Ask an image API for a render in mid-2026 and you get back more than pixels. OpenAI's image models and Google's media models embed **C2PA Content Credentials** in the bytes they return: a cryptographically signed manifest saying *this came from us, generated, on this date*. We verified it the direct way: a `gpt-image-2` render requested through the plain API carries a `caBX` chunk, right there between `IHDR` and the pixel data.

Here is the part nobody tells you: **that signature hashes the file's byte ranges.** The manifest records exclusion ranges for itself and signs everything else. Which means *any* tool that writes into the file afterward (a metadata tagger, an optimizer, a workflow engine adding its own note) doesn't strip the credentials. It does something worse. The manifest stays present and parseable, and validation now fails. *"Present but tampered"* is the verdict a checker renders. An asset with no credentials is merely unattributed; an asset with broken credentials looks forged.

We know because we did it. Nika saves every generated PNG with a small `nika` tEXt chunk (tool, engine version, provider, prompt, seed) so provenance survives a `cp` away from its sidecar manifest. Good practice, borrowed from ComfyUI and InvokeAI. Applied to a signed OpenAI render, that same chunk invalidated the upstream signature. Our provenance feature was destroying better provenance than it added.

The fix is a rule worth stating generally, because as of this week it is normative in the [spec](https://github.com/supernovae-st/nika-spec):

**Detect before you write. If it's signed, stand down.**

The engine now scans every returned payload for credential carriage before any in-file write: a `caBX` chunk in PNG, an APP11 JUMBF segment in JPEG, a `C2PA` RIFF chunk in WebP *and WAV*, a `GEOB` frame naming `application/c2pa` in MP3 (audio credentials are real: Google's Lyria and ElevenLabs ship them). Exact byte signatures, zero dependencies, total on adversarial input. When credentials are present, the `nika` chunk is not embedded (their signed manifest outranks our informal one) and the run says so out loud:

```text
content_credentials_preserved: upstream c2pa manifest detected —
the `nika` tEXt chunk was NOT embedded (it would invalidate the signature)
```

The output and the sidecar manifest both carry the fact:

```json
"content_credentials": "c2pa",
"watermark_declared": "synthid (provider-declared · not byte-verified)"
```

Read those two fields carefully, because their wording is the honest part. `content_credentials: "c2pa"` means *detected*: we found the carriage, we did not cryptographically validate the chain. An engine that hasn't verified must never say "verified"; a recent formal analysis of C2PA (arXiv:2604.24890) is blunt about how much weight the ecosystem's claims can bear, and we'd rather under-claim. And `watermark_declared` is a provider *fact*, not a detection: SynthID's image and audio detectors are closed. Only Google can check. Anyone who tells you their pipeline "detects SynthID" is selling something.

Why now? Because the calendar says so. **EU AI Act, Article 50, applies from August 2, 2026**, four weeks from this post. Providers of generative systems must ensure outputs are "marked in a machine-readable format and detectable as artificially generated," and the marking must be *robust*. A pipeline that silently breaks upstream marks degrades exactly the property the law names. A pipeline that detects, preserves, and surfaces them gives its operator evidence.

No other workflow engine looks at these octets. n8n saves the binary; Make hands the file down the pipe; the agent frameworks paste result URLs into context. None of them will tell you the asset was signed, none of them will notice when a step breaks the signature. Nika's whole media design (assets on disk, sha256-named, manifest beside them, bytes never in workflow state) exists so that questions like *"what happened to this file between generation and publication?"* have an answer. Preserving the generator's own cryptographic answer is the obvious next brick.

The roadmap from here is deliberate: **detect** (shipped, this post) → **verify offline** (a reserved crate, pure-Rust crypto, bundled trust lists, no network: the sovereignty rules apply to verification too) → **sign our own**, with the operator's key, so a generate → edit → publish chain carries one auditable provenance line from end to end.

Your assets are already signed. The least your tooling can do is stop breaking them.
