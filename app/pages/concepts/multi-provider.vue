<script setup lang="ts">
useSeoMeta({
  title: 'Multi-Provider LLM: One Workflow, Any AI Model | Nika Research',
  description: 'Switch between Claude, GPT-4, Gemini, and Ollama with one line. Mix providers in a single workflow for cost optimization. Zero vendor lock-in, intelligent routing, and enterprise-ready fallbacks.',
  ogTitle: 'Multi-Provider LLM Orchestration | Nika',
  ogDescription: 'One workflow, any AI model. Claude + GPT-4 + Gemini + Ollama. Zero lock-in.',
  keywords: 'multi-provider LLM orchestration, Claude GPT Gemini Ollama, vendor agnostic AI workflow, LLM routing optimization, model switching AI, local LLM privacy, multi-model AI pipeline',
});

const providers = [
  {
    name: 'Anthropic',
    models: ['claude-opus-4', 'claude-sonnet-4-5', 'claude-haiku'],
    color: 'space',
    share: '40%',
  },
  {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    color: 'green',
    share: '27%',
  },
  {
    name: 'Google',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    color: 'amber',
    share: '21%',
  },
  {
    name: 'Local (Ollama)',
    models: ['llama3.2', 'mistral', 'codellama'],
    color: 'cyan',
    share: 'Growing',
  },
];

const benefits = [
  {
    title: 'No Vendor Lock-in',
    description: 'Switch providers without rewriting workflows. Same YAML, different model.',
    icon: 'mdi:lock-open',
  },
  {
    title: 'Cost Optimization',
    description: 'Use cheaper models for simple tasks, powerful ones for complex reasoning.',
    icon: 'mdi:currency-usd',
  },
  {
    title: 'Resilience',
    description: 'If one provider is down, failover to another automatically.',
    icon: 'mdi:shield-check',
  },
  {
    title: 'Best Tool for the Job',
    description: 'Claude for coding, GPT for creative, Gemini for multimodal, local for privacy.',
    icon: 'mdi:tools',
  },
];
</script>

<template>
  <article class="min-h-screen pt-24 pb-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="mb-8">
        <ol class="flex items-center gap-2 text-sm text-terminal-muted">
          <li><NuxtLink to="/" class="hover:text-white">Home</NuxtLink></li>
          <li><Icon name="mdi:chevron-right" class="w-4 h-4" /></li>
          <li><NuxtLink to="/concepts" class="hover:text-white">Concepts</NuxtLink></li>
          <li><Icon name="mdi:chevron-right" class="w-4 h-4" /></li>
          <li class="text-terminal-cyan">Multi-Provider</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-cyan to-cyan-800 flex items-center justify-center">
            <Icon name="mdi:swap-horizontal" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="text-xs px-2 py-1 rounded-full border bg-terminal-green/20 text-terminal-green border-terminal-green/30">
              Core Feature
            </span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Multi-Provider Orchestration</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          One workflow definition. Any LLM provider. Zero lock-in.
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- Market Context -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:chart-pie" class="w-6 h-6 text-terminal-cyan" />
            The LLM Market in 2025
          </h2>

          <p class="text-terminal-muted mb-6">
            Enterprise LLM adoption has shifted dramatically. Based on Menlo Ventures research:
          </p>

          <div class="grid sm:grid-cols-4 gap-4 mb-6">
            <div
              v-for="provider in providers"
              :key="provider.name"
              class="p-4 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <p
                class="text-2xl font-bold mb-1"
                :class="{
                  'text-space-400': provider.color === 'space',
                  'text-terminal-green': provider.color === 'green',
                  'text-amber-400': provider.color === 'amber',
                  'text-terminal-cyan': provider.color === 'cyan',
                }"
              >
                {{ provider.share }}
              </p>
              <p class="text-white font-semibold text-sm">{{ provider.name }}</p>
              <p class="text-terminal-muted text-xs mt-1">{{ provider.models.slice(0, 2).join(', ') }}</p>
            </div>
          </div>

          <div class="bg-terminal-cyan/10 border border-terminal-cyan/20 rounded-lg p-4">
            <p class="text-terminal-text text-sm">
              <Icon name="mdi:information" class="w-4 h-4 inline mr-1 text-terminal-cyan" />
              Key insight: No single provider dominates. Enterprise teams use 2-3 providers on average.
              Your workflow tool should support this reality.
            </p>
          </div>
        </section>

        <!-- How It Works -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:code-braces" class="w-6 h-6 text-terminal-cyan" />
            How It Works in Nika
          </h2>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code class="language-yaml"># Define providers once at the top
providers:
  anthropic:
    type: anthropic
    apiKeyEnv: ANTHROPIC_API_KEY
  openai:
    type: openai
    apiKeyEnv: OPENAI_API_KEY
  local:
    type: ollama
    baseUrl: http://localhost:11434

# Use different models per task
tasks:
  - id: analyze
    agent:
      prompt: "Deep code analysis"
      model: claude-opus-4        # Best for reasoning
      provider: anthropic

  - id: generate-docs
    agent:
      prompt: "Write documentation"
      model: gpt-4o              # Good for writing
      provider: openai

  - id: quick-check
    agent:
      prompt: "Quick syntax check"
      model: llama3.2            # Free, fast, local
      provider: local</code></pre>
          </div>

          <p class="text-terminal-muted">
            Each task can use a different provider and model. The runner handles authentication,
            API differences, and response normalization transparently.
          </p>
        </section>

        <!-- Benefits -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:check-decagram" class="w-6 h-6 text-terminal-cyan" />
            Why This Matters
          </h2>

          <div class="grid sm:grid-cols-2 gap-4">
            <div
              v-for="benefit in benefits"
              :key="benefit.title"
              class="p-4 bg-terminal-surface/50 rounded-lg border border-terminal-border"
            >
              <div class="flex items-center gap-2 mb-2">
                <Icon :name="benefit.icon" class="w-5 h-5 text-terminal-cyan" />
                <h3 class="font-semibold text-white">{{ benefit.title }}</h3>
              </div>
              <p class="text-terminal-muted text-sm">{{ benefit.description }}</p>
            </div>
          </div>
        </section>

        <!-- Intelligent Routing -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:robot" class="w-6 h-6 text-terminal-cyan" />
            Future: Intelligent Routing (Research)
          </h2>

          <p class="text-terminal-muted mb-4">
            Based on the "Pick and Spin" research framework (arXiv, Dec 2024), we're exploring
            automatic model routing that optimizes for:
          </p>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code># Potential future syntax (not implemented yet)
agent:
  prompt: "Complex analysis task"
  routing:
    strategy: auto           # Let Nika choose
    optimize:
      - relevance            # Best model for this task
      - latency              # Fastest response
      - cost                 # Cheapest option
    fallback: [claude-sonnet-4-5, gpt-4o]

# Research shows this can achieve:
# - 21.6% higher success rates
# - 30% lower latency
# - 33% lower cost per query</code></pre>
          </div>

          <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <p class="text-amber-300 text-sm">
              <Icon name="mdi:flask" class="w-4 h-4 inline mr-1" />
              <strong>Status:</strong> This is research territory. We're evaluating whether automatic
              routing adds enough value to justify the complexity. Your feedback matters.
            </p>
          </div>
        </section>

        <!-- MCP Protocol -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:connection" class="w-6 h-6 text-terminal-cyan" />
            Compatibility: Model Context Protocol (MCP)
          </h2>

          <p class="text-terminal-muted mb-4">
            Anthropic's MCP (announced Nov 2024) is becoming an industry standard for LLM tool integration.
            Nika supports MCP for tool invocation:
          </p>

          <div class="terminal-block">
            <pre class="text-sm"><code class="language-yaml"># Invoke MCP-compatible tools
tasks:
  - id: search-docs
    invoke:
      reference: "mcp::docs-search::query"
      args:
        query: "authentication flow"

# Works with any MCP server:
# - Anthropic's reference servers
# - Third-party integrations
# - Your custom MCP servers</code></pre>
          </div>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">Multi-provider support is live</p>
              <p class="text-terminal-muted text-sm">Use any model in your workflows.</p>
            </div>
            <div class="flex gap-3">
              <NuxtLink to="/concepts" class="btn-secondary">
                <Icon name="mdi:arrow-left" class="w-4 h-4" />
                All Concepts
              </NuxtLink>
              <a href="/#get-started" class="btn-primary">
                Join Waitlist
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  </article>
</template>
