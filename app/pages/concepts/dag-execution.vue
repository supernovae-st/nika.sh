<script setup lang="ts">
useSeoMeta({
  title: 'DAG Execution Engine: 10x Faster AI Workflow Orchestration | Nika Research',
  description: 'Nika\'s Directed Acyclic Graph engine delivers deterministic, auto-parallelized AI execution. Fan-out/fan-in patterns, 10 merge strategies, and production-grade reliability. Same inputs, same results—every time.',
  ogTitle: 'DAG Execution Engine | Nika',
  ogDescription: 'Deterministic AI orchestration. Auto-parallelization. 10x faster execution.',
  keywords: 'DAG execution AI, workflow orchestration engine, deterministic AI pipelines, parallel LLM processing, task dependency graph, agentic DAG, fan-out fan-in AI',
});

const benefits = [
  {
    title: 'Deterministic Execution',
    description: 'Same inputs, same execution order. Every time. No surprises in production.',
    icon: 'mdi:check-decagram',
  },
  {
    title: 'Automatic Parallelization',
    description: 'Independent tasks run concurrently. Dependencies are respected automatically.',
    icon: 'mdi:ray-start-arrow',
  },
  {
    title: 'Clear Error Boundaries',
    description: 'When a task fails, you know exactly what failed and what depends on it.',
    icon: 'mdi:alert-circle',
  },
  {
    title: 'Debuggable & Auditable',
    description: 'Full visibility into execution order, timing, and data flow.',
    icon: 'mdi:bug',
  },
];

const patterns = [
  { name: 'Sequential Chain', description: 'A → B → C', use: 'Step-by-step processing' },
  { name: 'Fan-Out', description: 'A → [B, C, D]', use: 'Parallel analysis' },
  { name: 'Fan-In', description: '[A, B, C] → D', use: 'Aggregation with merge' },
  { name: 'Diamond', description: 'A → [B, C] → D', use: 'Split-process-merge' },
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
          <li class="text-space-400">DAG Execution</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-space-600 to-space-800 flex items-center justify-center">
            <Icon name="mdi:sitemap" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="text-xs px-2 py-1 rounded-full border bg-terminal-green/20 text-terminal-green border-terminal-green/30">
              Core Architecture
            </span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">DAG Execution Engine</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          Directed Acyclic Graphs for predictable, parallel, production-ready AI workflows.
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- Why DAGs -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:help-circle" class="w-6 h-6 text-space-400" />
            Why DAG-Based Execution?
          </h2>

          <p class="text-terminal-muted mb-4">
            Most AI workflow tools give you one of two options: fully sequential (slow, simple) or
            fully agentic (fast, unpredictable). DAG-based execution gives you the best of both worlds.
          </p>

          <div class="bg-terminal-surface p-6 rounded-lg border border-terminal-border mb-6">
            <p class="text-terminal-muted mb-4">From recent research (Dec 2024):</p>
            <blockquote class="border-l-4 border-space-500 pl-4 italic text-terminal-text">
              "DAG-like structures model workflows as nodes (agents/tools) connected by edges with
              conditional logic, providing maximum control, debugging, and production reliability
              for tasks exceeding single-agent capabilities."
            </blockquote>
            <p class="text-xs text-terminal-muted mt-2">— Digital Applied, AI Agent Orchestration Guide</p>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 mb-6">
            <div
              v-for="benefit in benefits"
              :key="benefit.title"
              class="p-4 bg-terminal-surface/50 rounded-lg border border-terminal-border"
            >
              <div class="flex items-center gap-2 mb-2">
                <Icon :name="benefit.icon" class="w-5 h-5 text-space-400" />
                <h3 class="font-semibold text-white">{{ benefit.title }}</h3>
              </div>
              <p class="text-terminal-muted text-sm">{{ benefit.description }}</p>
            </div>
          </div>
        </section>

        <!-- How It Works -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:cog" class="w-6 h-6 text-space-400" />
            How It Works in Nika
          </h2>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code># You define tasks and flows...
tasks:
  - id: fetch
    fetch:
      url: "https://api.example.com/data"

  - id: analyze
    agent:
      prompt: "Analyze the fetched data"

  - id: validate
    agent:
      prompt: "Validate the analysis"

  - id: report
    agent:
      prompt: "Generate final report"

flows:
  - source: fetch
    target: [analyze, validate]  # Fan-out: parallel
  - source: [analyze, validate]  # Fan-in: wait for both
    target: report
    merge:
      strategy: all
      timeout: 30000

# Nika builds a DAG and executes optimally:
#
#         fetch
#        /      \
#   analyze    validate   ← Run in parallel
#        \      /
#         report          ← Wait for both, then run</code></pre>
          </div>

          <h3 class="text-xl font-semibold text-white mb-4">Common Patterns</h3>

          <div class="grid sm:grid-cols-2 gap-3">
            <div
              v-for="pattern in patterns"
              :key="pattern.name"
              class="p-4 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-white">{{ pattern.name }}</span>
                <code class="text-xs text-space-400 font-mono">{{ pattern.description }}</code>
              </div>
              <p class="text-terminal-muted text-sm">{{ pattern.use }}</p>
            </div>
          </div>
        </section>

        <!-- Immutability -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:lock" class="w-6 h-6 text-space-400" />
            The Immutability Guarantee
          </h2>

          <div class="bg-space-500/10 border border-space-500/20 rounded-lg p-6">
            <p class="text-terminal-text mb-4">
              One of Nika's <strong class="text-white">8 non-negotiable decisions</strong>:
            </p>
            <p class="text-xl font-mono text-space-400 text-center my-4">
              "The DAG is IMMUTABLE after parsing"
            </p>
            <p class="text-terminal-muted">
              This means: no agent, no runtime process, nothing can add or remove tasks during
              execution. What you define is what runs. Period.
            </p>
          </div>

          <div class="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p class="text-amber-300 text-sm">
              <Icon name="mdi:information" class="w-4 h-4 inline mr-1" />
              <strong>Why this matters:</strong> In production, you need to know exactly what your
              workflow will do. An agent that can modify its own task graph is unpredictable by design.
              We chose predictability.
            </p>
          </div>
        </section>

        <!-- Research Context -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:book-open" class="w-6 h-6 text-space-400" />
            Research Context (2024-2025)
          </h2>

          <p class="text-terminal-muted mb-4">
            Our approach aligns with recent industry trends toward <strong class="text-white">hybrid orchestration</strong>:
          </p>

          <ul class="space-y-3 text-terminal-muted">
            <li class="flex items-start gap-2">
              <Icon name="mdi:arrow-right" class="w-4 h-4 mt-1 text-space-400 flex-shrink-0" />
              <span><strong class="text-white">Dapr Agents</strong> uses deterministic workflows + PubSub for durable multi-agent coordination</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon name="mdi:arrow-right" class="w-4 h-4 mt-1 text-space-400 flex-shrink-0" />
              <span><strong class="text-white">Camunda</strong> embeds agents in BPMN flows for enterprise governance</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon name="mdi:arrow-right" class="w-4 h-4 mt-1 text-space-400 flex-shrink-0" />
              <span><strong class="text-white">LangGraph</strong> provides node-edge DAGs with memory persistence</span>
            </li>
          </ul>

          <p class="text-terminal-muted mt-4">
            Nika's differentiator: we're <strong class="text-white">YAML-first and CLI-native</strong>,
            making DAG-based workflows accessible without SDK boilerplate.
          </p>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">DAG execution is core to Nika</p>
              <p class="text-terminal-muted text-sm">Try it in the upcoming beta.</p>
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
