---
slug: one-wire-five-servers
title: "One wire, five servers"
tag: Sovereignty
date: 2026-07-06
description: "The self-hosted media world quietly standardized on OpenAI's wire shapes. That accident of history is the best sovereignty news in years — and Nika's media builtins are built on it."
---

When we added image generation to the stdlib, the obvious move was a third cloud provider. The review said no: the engine already spoke to five *local* LLM runtimes, and the image path had zero. Sovereignty isn't a footnote in our doctrine — local-first is the presentation order, the default example, the first provider in every table. So we went looking for the local image wire.

What we found is the quiet standardization nobody announced: **the entire self-hosted media landscape converged on OpenAI's wire shapes.**

For images, `POST {base}/v1/images/generations` returning `data[].b64_json` is spoken by LocalAI (first-party, spec-complete), Ollama, stable-diffusion.cpp's `sd-server`, SGLang Diffusion and vLLM-Omni. Five independent server projects, five different model runtimes, one wire. For speech, `POST {base}/v1/audio/speech` returning raw audio bytes is spoken by LocalAI, Kokoro-FastAPI, Speaches and openedai-speech. And for video — coming later, but the research is done — vLLM-Omni mirrors the Sora job lifecycle byte for byte, down to the `/content` endpoint that returns the MP4.

So Nika's `local` provider is one adapter per media type, and it covers *everything you can run on your own metal*:

```bash
export NIKA_IMAGE_LOCAL_URL=http://localhost:8080   # LocalAI — or :1234 sd-server, :11434 Ollama
export NIKA_TTS_LOCAL_URL=http://localhost:8880     # Kokoro — or LocalAI, Speaches
```

```yaml
provider: local        # the sovereign path — first in every table, on purpose
```

Three design decisions make this more than a convenience:

**The base URL is engine config, never workflow data.** Nika's provider calls ride a dedicated HTTP plane with SSRF protection *disabled* — safe only because endpoints are engine-fixed constants. A configurable endpoint could have broken that reasoning, so it doesn't enter through the workflow: `NIKA_IMAGE_LOCAL_URL` resolves once, at the composition root, exactly where API keys do. No `provider_options` key reaches the URL. A workflow cannot steer the engine's sockets, period — we had an adversarial reviewer try.

**The wire's defaults are not your defaults.** LocalAI defaults to *URL mode* — it answers with a link to the render. Nika forces `response_format: b64_json` on every url-capable wire and hard-refuses url-only responses, because fetching a provider-supplied URL would reopen the exact network boundary the fixed-endpoint design closed. Result URLs are never fetched; that's normative spec language now, not a preference.

**Honesty about what a self-hosted server is.** A local server is *less vetted* than api.openai.com by definition — that's the point of running your own. So the trust seams assume it: a verbose server that reflects your `Authorization` header into an error body gets scrubbed before the message can reach workflow outputs or an agent's context. Local renders get a 300-second default timeout because CPU diffusion takes minutes, and the timeout error tells you which three ports to check. The provenance manifest records `endpoint_host` — *which* server rendered this asset — because once the endpoint is configurable, that fact is load-bearing.

There's also what the `local` provider deliberately isn't: inferred. `provider: openai` can be guessed from `model: gpt-image-2`; model names on self-hosted servers mean whatever your server says they mean, so `local` is always explicit. And its `model:` default follows LocalAI's convention while the docs tell you plainly: set it to match *your* server.

The deeper reason this matters is the one in our alignment doctrine. Cloud media APIs are wonderful and we wire them happily — with attribution, exact cost metering, and their signatures preserved. But a workflow you can only run against someone else's datacenter is a workflow someone else can turn off, reprice, or subpoena. The one-wire accident means the sovereign path costs us one adapter — and costs you one environment variable.

Five servers today. The wire will outlive all of them. That's what a standard looks like when nobody had to vote on it.
