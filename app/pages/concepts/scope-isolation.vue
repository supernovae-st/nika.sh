<script setup lang="ts">
useSeoMeta({
  title: 'Scope Isolation: Revolutionary 3D Context Architecture for AI | Nika Research',
  description: 'Control what each AI agent sees with Nika\'s 3D scope system: DAG position, transcript history, and state exposure. 4 presets (minimal, default, debug, full) for enterprise-grade security and token optimization.',
  ogTitle: 'Scope Isolation: 3D Context Architecture | Nika',
  ogDescription: 'Revolutionary context control for multi-agent AI. Reduce hallucinations, optimize tokens, ensure security.',
  keywords: 'AI context management, agent isolation LLM, context window optimization, multi-agent security patterns, scope presets, DAG AI execution, token optimization AI',
});

const presets = [
  {
    name: 'minimal',
    icon: '◎',
    color: 'amber',
    description: 'Fresh 200K context, completely isolated',
    dag: 'No access to other task results',
    transcripts: 'Starts with empty history',
    state: 'Cannot read or write shared state',
    useCase: 'Security-sensitive operations, untrusted inputs',
  },
  {
    name: 'default',
    icon: '◈',
    color: 'cyan',
    description: 'Position-aware context (standard)',
    dag: 'Access to direct ancestors only',
    transcripts: 'Inherits from parent tasks',
    state: 'Read-only access to resolved inputs',
    useCase: 'Most workflows, balanced isolation',
  },
  {
    name: 'debug',
    icon: '⊕',
    color: 'space',
    description: 'Can read main context, writes isolated',
    dag: 'Full DAG visibility (read-only)',
    transcripts: 'Can read all, writes to isolated buffer',
    state: 'Full read, isolated write',
    useCase: 'Debugging, analysis, observability',
  },
  {
    name: 'full',
    icon: '◉',
    color: 'space',
    description: 'Full context access, accumulates transcripts',
    dag: 'Complete access to all task outputs',
    transcripts: 'Full read/write, persists across tasks',
    state: 'Full read/write access',
    useCase: 'Orchestrator agents, aggregation tasks',
  },
];

const dimensions = [
  {
    name: 'DAG',
    description: 'What results from other tasks can this agent see?',
    icon: 'mdi:sitemap',
  },
  {
    name: 'Transcripts',
    description: 'What conversation history is available?',
    icon: 'mdi:message-text',
  },
  {
    name: 'State',
    description: 'What shared state can be read or modified?',
    icon: 'mdi:database',
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
          <li class="text-terminal-cyan">Scope Isolation</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-cyan to-cyan-800 flex items-center justify-center">
            <Icon name="mdi:cube-outline" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="text-xs px-2 py-1 rounded-full border bg-terminal-green/20 text-terminal-green border-terminal-green/30">
              Implemented in v7.0
            </span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Scope Isolation</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          A 3-dimensional approach to controlling what each AI agent can see and do.
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- The Problem -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:shield-alert" class="w-6 h-6 text-terminal-cyan" />
            Why Context Isolation Matters
          </h2>

          <p class="text-terminal-muted mb-4">
            In a multi-agent workflow, not every agent should see everything. Consider:
          </p>

          <ul class="space-y-2 text-terminal-muted mb-6">
            <li class="flex items-start gap-2">
              <Icon name="mdi:alert" class="w-4 h-4 mt-1 text-amber-400 flex-shrink-0" />
              A code analysis agent shouldn't leak secrets to a reporting agent
            </li>
            <li class="flex items-start gap-2">
              <Icon name="mdi:alert" class="w-4 h-4 mt-1 text-amber-400 flex-shrink-0" />
              A sandboxed agent processing untrusted input shouldn't pollute the main context
            </li>
            <li class="flex items-start gap-2">
              <Icon name="mdi:alert" class="w-4 h-4 mt-1 text-amber-400 flex-shrink-0" />
              A debugging agent should observe without modifying state
            </li>
          </ul>

          <p class="text-terminal-muted">
            Most workflow tools give you "shared context" or "no context" — a binary choice.
            We think context should be <strong class="text-white">graduated and orthogonal</strong>.
          </p>
        </section>

        <!-- 3 Dimensions -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:axis-arrow" class="w-6 h-6 text-terminal-cyan" />
            The Three Dimensions
          </h2>

          <div class="grid gap-4 mb-6">
            <div
              v-for="dim in dimensions"
              :key="dim.name"
              class="flex items-center gap-4 p-4 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <div class="w-12 h-12 rounded-lg bg-terminal-cyan/10 flex items-center justify-center">
                <Icon :name="dim.icon" class="w-6 h-6 text-terminal-cyan" />
              </div>
              <div>
                <h3 class="font-semibold text-white">{{ dim.name }}</h3>
                <p class="text-terminal-muted text-sm">{{ dim.description }}</p>
              </div>
            </div>
          </div>

          <div class="terminal-block">
            <pre class="text-sm"><code># Each preset is an ALIAS for a 3D configuration
# You can think of it as coordinates in context-space

preset: minimal  = (dag: none, transcripts: none, state: none)
preset: default  = (dag: ancestors, transcripts: parent, state: read)
preset: debug    = (dag: all-read, transcripts: all-read, state: read)
preset: full     = (dag: all, transcripts: all, state: read-write)</code></pre>
          </div>
        </section>

        <!-- Presets Table -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:tune-variant" class="w-6 h-6 text-terminal-cyan" />
            The Four Presets
          </h2>

          <div class="space-y-4">
            <div
              v-for="preset in presets"
              :key="preset.name"
              class="p-5 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <div class="flex items-center gap-3 mb-3">
                <span
                  class="text-2xl font-mono"
                  :class="{
                    'text-amber-400': preset.color === 'amber',
                    'text-terminal-cyan': preset.color === 'cyan',
                    'text-space-400': preset.color === 'space',
                  }"
                >
                  {{ preset.icon }}
                </span>
                <h3 class="font-bold text-white text-lg">{{ preset.name }}</h3>
                <span class="text-terminal-muted text-sm">— {{ preset.description }}</span>
              </div>

              <div class="grid sm:grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span class="text-terminal-muted">DAG:</span>
                  <p class="text-terminal-text">{{ preset.dag }}</p>
                </div>
                <div>
                  <span class="text-terminal-muted">Transcripts:</span>
                  <p class="text-terminal-text">{{ preset.transcripts }}</p>
                </div>
                <div>
                  <span class="text-terminal-muted">State:</span>
                  <p class="text-terminal-text">{{ preset.state }}</p>
                </div>
              </div>

              <div class="text-sm text-terminal-muted">
                <Icon name="mdi:lightbulb-outline" class="w-4 h-4 inline" />
                <strong>Best for:</strong> {{ preset.useCase }}
              </div>
            </div>
          </div>
        </section>

        <!-- YAML Example -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:code-braces" class="w-6 h-6 text-terminal-cyan" />
            Usage in Workflows
          </h2>

          <div class="terminal-block">
            <pre class="text-sm"><code class="language-yaml">tasks:
  - id: fetch-secrets
    agent:
      prompt: "Retrieve API credentials"
      scopePreset: minimal  # ◎ Isolated - can't leak

  - id: process-data
    agent:
      prompt: "Transform the data"
      scopePreset: default  # ◈ Standard inheritance

  - id: debug-check
    agent:
      prompt: "Analyze what happened"
      scopePreset: debug    # ⊕ Can see everything, can't modify

  - id: orchestrate
    agent:
      prompt: "Coordinate all agents"
      scopePreset: full     # ◉ Full access for orchestration</code></pre>
          </div>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">This is implemented in Nika v7.0</p>
              <p class="text-terminal-muted text-sm">Join the beta to try it out.</p>
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
