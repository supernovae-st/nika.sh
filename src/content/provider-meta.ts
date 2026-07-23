/* ─── provider-meta · the authored layer of the provider rooms ────────────────
   One entry per spec-named provider. The DERIVED facts (models · dialect ·
   env var · kind) ride providers.generated.ts and are never re-typed here;
   this module carries what no catalog field can: the angle, the setup
   ritual, the pick-it-when line, and the durable governance note.

   Console URLs verified 2026-07-24 against the providers' own live docs
   (three of them moved in the last year — platform.claude.com ·
   platform.kimi.ai · Mistral's console — stale links are a real class).
   The gate (provider-usage.test.ts) pins this map to the exact catalog id
   set: a new provider without an authored entry goes red, never a bare room. */

export interface ProviderMeta {
  /** the intent-bearing title head — the page renders `${title} · Nika` */
  title: string
  /** the authored angle · joins the engine's own description in the lede */
  angle: string
  /** the swap story: pick it when … (one line) */
  pick: string
  /** durable jurisdiction / governance note — only where it earns its place */
  note?: string
  /** where the key comes from (cloud only) — verified 2026-07 */
  console?: { label: string; href: string }
  /** the get-set-up ritual · text + optional copyable command */
  setup: { text: string; code?: string }[]
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
  ollama: {
    title: 'Ollama · run Nika workflows locally, no key',
    angle:
      'The shortest path to local: pull a model once, point the file at it, and nothing leaves the machine.',
    pick: 'the default when the work is private, frequent, or should cost hardware instead of tokens.',
    note: 'Open source (MIT) with its own inference engine and model library.',
    setup: [
      { text: 'Install the runtime', code: 'brew install ollama' },
      { text: 'Pull the model the file names', code: 'ollama pull qwen3.5:4b' },
      { text: 'No key: the server answers on localhost:11434.' },
    ],
  },
  lmstudio: {
    title: 'LM Studio · Nika workflows on the loaded model',
    angle:
      'A desktop app that loads a model and serves it: the file talks to whatever LM Studio has loaded, over the same wire shape as any cloud.',
    pick: 'when you want a GUI to audition models before a file commits to one.',
    note: 'Free for home and work use; the SDKs and CLI are open source.',
    setup: [
      { text: 'Download the app at lmstudio.ai and load a model.' },
      { text: 'Start the local server (default port 1234). No key.' },
    ],
  },
  llamacpp: {
    title: 'llama.cpp · Nika workflows on bare GGUF',
    angle:
      'The C/C++ engine most local stacks build on: one quantized GGUF, one llama-server, zero dependencies.',
    pick: 'when you want the metal — quantized weights, CPU and GPU offload, nothing else running.',
    note: 'Open source (MIT) · the upstream lives at ggml-org/llama.cpp.',
    setup: [
      { text: 'Install the server', code: 'brew install llama.cpp' },
      { text: 'Serve the GGUF you have', code: 'llama-server -m model.gguf' },
      { text: 'The wire model id is free-form — the server answers for whatever it loaded.' },
    ],
  },
  localai: {
    title: 'LocalAI · a self-hosted endpoint for Nika workflows',
    angle:
      'A self-hosted server that speaks the familiar API shape, with a model gallery and a web UI: one shared endpoint instead of per-laptop runtimes.',
    pick: 'when a team wants one local endpoint they administer together.',
    note: 'Open source (MIT), community-led.',
    setup: [
      {
        text: 'Run the container',
        code: 'docker run -p 8080:8080 --name local-ai -ti localai/localai:latest',
      },
      { text: 'Pick models from its gallery. No key.' },
    ],
  },
  vllm: {
    title: 'vLLM · high-throughput Nika workflow batches',
    angle:
      'The serving engine for throughput: PagedAttention and continuous batching turn one GPU into a fleet, behind the standard wire shape.',
    pick: 'when the batch is the unit of work and tokens per second is the bill.',
    note: 'Open source (Apache-2.0) · a PyTorch Foundation project, born at UC Berkeley.',
    setup: [
      { text: 'Install', code: 'uv pip install vllm' },
      { text: 'Serve the model the file names', code: 'vllm serve Qwen/Qwen3-8B' },
    ],
  },
  mistral: {
    title: 'Mistral · EU-based frontier models for Nika workflows',
    angle:
      'Frontier models from Paris: a European home for workflows that must stay under European law, with open-weight releases alongside the API.',
    pick: 'when European jurisdiction is a requirement, not a preference.',
    note: 'Mistral AI · Paris, France.',
    console: { label: 'console.mistral.ai', href: 'https://console.mistral.ai' },
    setup: [
      { text: 'Create a key in the console (API Keys).' },
      { text: 'The key rides the environment, never the file', code: 'export MISTRAL_API_KEY=…' },
    ],
  },
  anthropic: {
    title: 'Anthropic Claude · reasoned Nika workflows',
    angle:
      'Claude models with explicit thinking budgets: the reasoning is a declared line item in the file, priced by the audit like everything else.',
    pick: 'careful reading, long documents, reviews where the reasoning should be visible.',
    console: { label: 'platform.claude.com', href: 'https://platform.claude.com/settings/keys' },
    setup: [
      { text: 'Create a key in the Claude console.' },
      { text: 'The key rides the environment, never the file', code: 'export ANTHROPIC_API_KEY=…' },
    ],
  },
  openai: {
    title: 'OpenAI · typed outputs in Nika workflows',
    angle:
      'The most widely known API. Structured outputs make schema: a real contract — the answer arrives as data the next task can trust.',
    pick: 'when downstream tasks consume the answer as data, not prose.',
    console: { label: 'platform.openai.com', href: 'https://platform.openai.com/api-keys' },
    setup: [
      { text: 'Create a key in the platform console.' },
      { text: 'The key rides the environment, never the file', code: 'export OPENAI_API_KEY=…' },
    ],
  },
  gemini: {
    title: 'Google Gemini · fast long-context Nika workflows',
    angle:
      'The Gemini API: a fast flash tier and long context, with keys managed in Google AI Studio.',
    pick: 'quick digests and long inputs on a generous free tier.',
    console: { label: 'aistudio.google.com', href: 'https://aistudio.google.com/apikey' },
    setup: [
      { text: 'Create a key in AI Studio (keys are project-scoped).' },
      { text: 'The key rides the environment, never the file', code: 'export GEMINI_API_KEY=…' },
    ],
  },
  deepseek: {
    title: 'DeepSeek · frontier quality at floor prices',
    angle:
      'Strong models at aggressive prices, with an open-weight track record — the audit’s cost ceiling stays almost invisible.',
    pick: 'high-volume text work where the price per call decides.',
    note: 'DeepSeek · Hangzhou, China.',
    console: { label: 'platform.deepseek.com', href: 'https://platform.deepseek.com/api_keys' },
    setup: [
      { text: 'Create a key in the platform console.' },
      { text: 'The key rides the environment, never the file', code: 'export DEEPSEEK_API_KEY=…' },
    ],
  },
  xai: {
    title: 'xAI Grok · Nika workflows on Grok models',
    angle: 'Grok models behind an OpenAI-compatible API, keys from the x.ai console.',
    pick: 'fast reasoning tiers with current-events flavor.',
    console: { label: 'console.x.ai', href: 'https://console.x.ai' },
    setup: [
      { text: 'Create a key in the console.' },
      { text: 'The key rides the environment, never the file', code: 'export XAI_API_KEY=…' },
    ],
  },
  groq: {
    title: 'Groq · instant fan-outs on LPU hardware',
    angle:
      'Custom LPU hardware serving open models at extreme tokens per second. Groq is the chip company, not the model — no relation to Grok.',
    pick: 'wide fan-outs and interactive loops where latency is the feature.',
    console: { label: 'console.groq.com', href: 'https://console.groq.com/keys' },
    setup: [
      { text: 'Create a key in the console.' },
      { text: 'The key rides the environment, never the file', code: 'export GROQ_API_KEY=…' },
    ],
  },
  openrouter: {
    title: 'OpenRouter · many vendors, one key',
    angle:
      'One key and one endpoint route to many vendors: the model id carries the vendor and the router owns the hop, fallbacks included.',
    pick: 'comparing vendors, or refusing to carry one key per provider.',
    console: { label: 'openrouter.ai', href: 'https://openrouter.ai/settings/keys' },
    setup: [
      { text: 'Create a key in the settings.' },
      { text: 'The key rides the environment, never the file', code: 'export OPENROUTER_API_KEY=…' },
    ],
  },
  huggingface: {
    title: 'Hugging Face · open weights as a provider',
    angle:
      'The open-weights hub as an inference provider: one token routes across a network of partner clouds, and a policy suffix on the model id picks fastest or cheapest.',
    pick: 'open-weight models without owning the serving stack.',
    console: {
      label: 'huggingface.co/settings/tokens',
      href: 'https://huggingface.co/settings/tokens',
    },
    setup: [
      { text: 'Create a fine-grained token with the Inference Providers permission.' },
      { text: 'The token rides the environment, never the file', code: 'export HF_TOKEN=…' },
    ],
  },
  nvidia: {
    title: 'NVIDIA NIM · hosted now, self-hosted later',
    angle:
      'The NIM catalog hosted: try models from many vendors on one endpoint, then self-host the same containers on your own GPUs when it gets serious.',
    pick: 'evaluating across vendors with a self-hosting exit already on the map.',
    console: { label: 'build.nvidia.com', href: 'https://build.nvidia.com' },
    setup: [
      { text: 'Get an API key from any model page on the catalog.' },
      { text: 'The key rides the environment, never the file', code: 'export NVIDIA_API_KEY=…' },
    ],
  },
  moonshot: {
    title: 'Moonshot Kimi · long context, cataloged ahead',
    angle:
      'Kimi models built for very long context. Cataloged ahead of the runtime: this binary names the vendor, a coming release runs it — the audit below says so honestly.',
    pick: 'whole-document work, once the runtime lands.',
    note: 'Moonshot AI · Beijing, China.',
    console: { label: 'platform.kimi.ai', href: 'https://platform.kimi.ai' },
    setup: [
      { text: 'Create a key in the Kimi platform console.' },
      { text: 'The key rides the environment, never the file', code: 'export MOONSHOT_API_KEY=…' },
    ],
  },
  mock: {
    title: 'mock · rehearse workflows for free',
    angle:
      'The harness: deterministic, offline, free. Every file should rehearse here before it costs anything — going real is a one-word diff.',
    pick: 'always first. Author against mock, then swap the model line.',
    setup: [
      { text: 'Nothing to install and no key — the engine ships it.' },
      { text: 'Rehearse any file', code: 'nika run file.nika.yaml --model mock/mock-default' },
    ],
  },
}
