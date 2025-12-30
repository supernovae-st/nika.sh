<script setup lang="ts">
useSeoMeta({
  title: 'Graceful Degradation: AI Workflows That Bend, Never Break | Nika Research',
  description: 'Build AI workflows that maintain core functionality when components fail. Nika implements progressive fallbacks, retry logic, and automatic model switching for bulletproof production reliability.',
  ogTitle: 'Graceful Degradation for AI Workflows | Nika',
  ogDescription: 'AI systems that bend but never break. Fallbacks, retries, and resilience patterns for production.',
  keywords: 'graceful degradation AI, fallback strategies LLM, resilient AI workflows, progressive enhancement AI, fault tolerance agentic, retry patterns AI, production AI reliability',
});

const strategies = [
  {
    name: 'Model Fallback',
    icon: 'mdi:swap-horizontal',
    description: 'When Claude Opus fails, fall back to Sonnet. When Sonnet fails, try Haiku. Always have a cheaper, faster backup.',
    example: 'claude-opus-4 → claude-sonnet-4-5 → claude-haiku',
    color: 'space',
  },
  {
    name: 'Provider Switching',
    icon: 'mdi:cloud-sync',
    description: 'If Anthropic API is down, route to OpenAI. If OpenAI is slow, try Gemini. Multi-provider redundancy built-in.',
    example: 'anthropic → openai → google → ollama',
    color: 'cyan',
  },
  {
    name: 'Scope Reduction',
    icon: 'mdi:shield-half-full',
    description: 'Under pressure, reduce agent scope from full to minimal. Less context = faster recovery, lower cost.',
    example: 'full → default → minimal',
    color: 'amber',
  },
  {
    name: 'Task Simplification',
    icon: 'mdi:puzzle',
    description: 'Complex multi-step task failing? Break it down. Run simpler sub-tasks. Aggregate partial results.',
    example: 'analyze-all → analyze-chunk-1, chunk-2, chunk-3',
    color: 'green',
  },
];

const levels = [
  {
    level: 'L1: Retry',
    actions: ['Immediate retry with same config', 'Exponential backoff', 'Jitter to avoid thundering herd'],
    latency: '< 1s',
    impact: 'None',
  },
  {
    level: 'L2: Adapt',
    actions: ['Switch to faster model', 'Reduce context window', 'Trim non-essential tools'],
    latency: '1-5s',
    impact: 'Minor quality reduction',
  },
  {
    level: 'L3: Fallback',
    actions: ['Switch provider entirely', 'Use cached response', 'Run simplified workflow'],
    latency: '5-30s',
    impact: 'Moderate quality reduction',
  },
  {
    level: 'L4: Degrade',
    actions: ['Return partial results', 'Skip optional steps', 'Escalate to human'],
    latency: '> 30s',
    impact: 'Functionality reduced',
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
          <li class="text-terminal-green">Graceful Degradation</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-green to-green-800 flex items-center justify-center">
            <Icon name="mdi:shield-sync" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge">Design Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Graceful Degradation</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          AI workflows that bend under pressure — but never break.
        </p>
      </header>

      <!-- Core Principle -->
      <section class="mb-12">
        <div class="terminal-block">
          <p class="text-terminal-green font-mono text-lg mb-2">
            "Assume failure. Design for recovery."
          </p>
          <p class="text-terminal-muted">
            In production, things fail. APIs timeout. Models hallucinate. Rate limits hit.
            Graceful degradation ensures your workflow <strong class="text-white">keeps running</strong>,
            even if not at full capacity.
          </p>
        </div>
      </section>

      <!-- The Problem -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Why AI Workflows Fail Hard</h2>
        <p class="text-terminal-muted leading-relaxed mb-4">
          Traditional AI orchestration treats failures as exceptions. But in agentic systems:
        </p>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 class="font-semibold text-red-400 mb-2">Cascading Failures</h4>
            <p class="text-terminal-muted text-sm">One agent fails → dependent agents stall → entire workflow crashes.</p>
          </div>
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 class="font-semibold text-red-400 mb-2">Single Points of Failure</h4>
            <p class="text-terminal-muted text-sm">One provider outage → all workflows stop. No redundancy.</p>
          </div>
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 class="font-semibold text-red-400 mb-2">All-or-Nothing</h4>
            <p class="text-terminal-muted text-sm">Either perfect results or complete failure. No middle ground.</p>
          </div>
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 class="font-semibold text-red-400 mb-2">Cost Explosions</h4>
            <p class="text-terminal-muted text-sm">Infinite retries on expensive models burn through budgets.</p>
          </div>
        </div>
      </section>

      <!-- Degradation Strategies -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Four Pillars of Graceful Degradation</h2>
        <div class="space-y-4">
          <div
            v-for="strategy in strategies"
            :key="strategy.name"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                :class="{
                  'bg-space-500/20': strategy.color === 'space',
                  'bg-terminal-cyan/20': strategy.color === 'cyan',
                  'bg-amber-500/20': strategy.color === 'amber',
                  'bg-terminal-green/20': strategy.color === 'green',
                }"
              >
                <Icon
                  :name="strategy.icon"
                  class="w-6 h-6"
                  :class="{
                    'text-space-400': strategy.color === 'space',
                    'text-terminal-cyan': strategy.color === 'cyan',
                    'text-amber-400': strategy.color === 'amber',
                    'text-terminal-green': strategy.color === 'green',
                  }"
                />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-white mb-1">{{ strategy.name }}</h3>
                <p class="text-terminal-muted text-sm mb-2">{{ strategy.description }}</p>
                <code class="text-xs bg-terminal-border px-2 py-1 rounded text-terminal-cyan">
                  {{ strategy.example }}
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Degradation Levels -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">The 4-Level Degradation Ladder</h2>
        <p class="text-terminal-muted mb-6">
          Nika implements progressive degradation — start with minimal intervention, escalate only when needed:
        </p>
        <div class="space-y-3">
          <div
            v-for="(level, index) in levels"
            :key="level.level"
            class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <h4
                class="font-mono font-semibold"
                :class="{
                  'text-terminal-green': index === 0,
                  'text-terminal-cyan': index === 1,
                  'text-amber-400': index === 2,
                  'text-red-400': index === 3,
                }"
              >
                {{ level.level }}
              </h4>
              <div class="flex items-center gap-4 text-xs">
                <span class="text-terminal-muted">Latency: <strong class="text-white">{{ level.latency }}</strong></span>
                <span class="text-terminal-muted">Impact: <strong class="text-white">{{ level.impact }}</strong></span>
              </div>
            </div>
            <ul class="flex flex-wrap gap-2">
              <li
                v-for="action in level.actions"
                :key="action"
                class="text-xs px-2 py-1 rounded bg-terminal-border text-terminal-muted"
              >
                {{ action }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- YAML Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">In Practice: Resilient Workflows</h2>
        <div class="terminal-block">
          <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
            <span class="text-terminal-muted text-xs font-mono">resilient-workflow.nika.yaml</span>
          </div>
          <pre class="text-sm leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>providers:
  anthropic:
    type: anthropic
    priority: 1                <span class="text-terminal-cyan"># Primary provider</span>
  openai:
    type: openai
    priority: 2                <span class="text-terminal-cyan"># First fallback</span>
  ollama:
    type: ollama
    priority: 3                <span class="text-terminal-cyan"># Local fallback (always available)</span>

tasks:
  - id: analyze
    agent:
      prompt: "Deep security analysis"
      model: claude-opus-4
      fallback:
        - model: claude-sonnet-4-5   <span class="text-terminal-green"># L2: Cheaper model</span>
        - model: gpt-4o              <span class="text-amber-400"># L3: Different provider</span>
        - model: llama3.2            <span class="text-red-400"># L4: Local, always works</span>
      retry:
        maxAttempts: 3
        backoff: exponential
      timeout: 60000

  - id: quick-scan
    agent:
      prompt: "Quick security check, top issues only"
      model: claude-haiku      <span class="text-terminal-muted"># Degraded version</span>
      maxTurns: 3

flows:
  - source: analyze
    target: quick-scan
    condition: allFallbacksFailed   <span class="text-terminal-cyan"># Ultimate fallback</span></code></pre>
        </div>
      </section>

      <!-- Research Status -->
      <section class="p-6 bg-terminal-surface/30 border border-terminal-border rounded-xl">
        <h3 class="text-lg font-semibold text-white mb-3">
          <Icon name="mdi:flask" class="w-5 h-5 inline mr-2 text-terminal-green" />
          Implementation Status
        </h3>
        <ul class="space-y-2 text-sm text-terminal-muted">
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Multi-provider support — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Timeout and retry logic — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Automatic model fallback chains — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>SHAKA-driven degradation decisions — <strong class="text-amber-400">In Research</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts/bounded-rationality" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Bounded Rationality
        </NuxtLink>
        <NuxtLink to="/concepts/declarative-intent" class="btn-primary">
          Declarative Intent
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
