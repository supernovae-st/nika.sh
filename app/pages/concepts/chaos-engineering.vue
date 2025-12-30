<script setup lang="ts">
useSeoMeta({
  title: 'Chaos Engineering for AI: Test Resilience Before Production Breaks | Nika Research',
  description: 'Apply Netflix-style chaos engineering to AI workflows. Inject failures, test fallbacks, and validate resilience before your users discover the bugs. Controlled destruction for bulletproof production.',
  ogTitle: 'Chaos Engineering for AI Workflows | Nika',
  ogDescription: 'Break things on purpose. Inject failures. Build confidence. Chaos engineering for agentic AI.',
  keywords: 'chaos engineering AI, fault injection LLM, resilience testing AI workflows, failure simulation agents, chaos monkey AI, production testing AI, reliability engineering AI',
});

const experiments = [
  {
    name: 'Provider Outage',
    description: 'Simulate Anthropic API being unavailable. Does your workflow failover to OpenAI?',
    icon: 'mdi:cloud-off',
    inject: 'provider: anthropic → status: 503',
    expected: 'Automatic switch to openai provider',
  },
  {
    name: 'Latency Spike',
    description: 'Add 10s delay to model responses. Do agents timeout gracefully?',
    icon: 'mdi:timer-sand',
    inject: 'latency: +10000ms',
    expected: 'Timeout triggers, fallback model activates',
  },
  {
    name: 'Token Budget Exhaustion',
    description: 'Force agents to hit token limits mid-reasoning. Is context preserved?',
    icon: 'mdi:currency-usd-off',
    inject: 'maxTokens: 100',
    expected: 'Graceful truncation, no data loss',
  },
  {
    name: 'Hallucination Injection',
    description: 'Inject known-bad outputs. Does SHAKA detect the collapse risk?',
    icon: 'mdi:robot-confused',
    inject: 'output: randomized garbage',
    expected: 'Epistemic signals trigger, output rejected',
  },
  {
    name: 'Rate Limit Hammer',
    description: 'Overwhelm with concurrent requests. Does backoff work?',
    icon: 'mdi:speedometer',
    inject: 'concurrency: 100x normal',
    expected: 'Exponential backoff, queue management',
  },
  {
    name: 'Network Partition',
    description: 'Disconnect mid-workflow. Is state recoverable?',
    icon: 'mdi:lan-disconnect',
    inject: 'network: disconnect after task 2',
    expected: 'Checkpoint restore, resume from last good state',
  },
];

const principles = [
  {
    title: 'Hypothesis-Driven',
    description: 'Define what "normal" looks like. Measure deviation. Every experiment tests a specific resilience hypothesis.',
  },
  {
    title: 'Controlled Blast Radius',
    description: 'Start small. Test in staging. Expand scope gradually. Never chaos-test production without guardrails.',
  },
  {
    title: 'Automate Everything',
    description: 'Chaos experiments should run continuously. CI/CD pipelines include resilience validation.',
  },
  {
    title: 'Learn and Improve',
    description: 'Every failure teaches something. Document findings. Fix weaknesses. Build antifragility.',
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
          <li class="text-red-400">Chaos Engineering</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
            <Icon name="mdi:lightning-bolt" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.3); color: rgb(252, 165, 165);">Exploration Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Chaos Engineering</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          Break things on purpose — so production doesn't break by accident.
        </p>
      </header>

      <!-- Core Principle -->
      <section class="mb-12">
        <div class="terminal-block border-red-500/30">
          <p class="text-red-400 font-mono text-lg mb-2">
            "The best way to avoid failure in production is to practice failure in staging."
          </p>
          <p class="text-terminal-muted">
            Netflix invented Chaos Monkey to randomly kill servers. Nika applies the same philosophy to AI workflows:
            inject failures, observe behavior, validate resilience — before your users discover the bugs.
          </p>
        </div>
      </section>

      <!-- Netflix Attribution -->
      <section class="mb-12 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p class="text-red-300 text-sm">
          <Icon name="mdi:movie-open" class="w-4 h-4 inline mr-1" />
          <strong>Inspired by Netflix:</strong> Their Simian Army (Chaos Monkey, Latency Monkey, Chaos Gorilla)
          pioneered resilience testing at scale. We're bringing these principles to AI workflows where
          non-deterministic behavior makes reliability even more critical.
        </p>
      </section>

      <!-- Why AI Needs Chaos -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Why AI Workflows Need Chaos Engineering</h2>
        <p class="text-terminal-muted leading-relaxed mb-4">
          Traditional chaos engineering targets infrastructure. AI workflows are <strong class="text-white">inherently more chaotic</strong>:
        </p>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg">
            <h4 class="font-semibold text-white mb-2">Non-Deterministic Outputs</h4>
            <p class="text-terminal-muted text-sm">Same prompt, different results. Temperature, sampling, and model updates create variance.</p>
          </div>
          <div class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg">
            <h4 class="font-semibold text-white mb-2">Hidden State</h4>
            <p class="text-terminal-muted text-sm">Context windows, attention patterns, and internal model states are opaque.</p>
          </div>
          <div class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg">
            <h4 class="font-semibold text-white mb-2">Provider Dependencies</h4>
            <p class="text-terminal-muted text-sm">Rate limits, outages, and API changes from third parties. No control.</p>
          </div>
          <div class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg">
            <h4 class="font-semibold text-white mb-2">Cascading Failures</h4>
            <p class="text-terminal-muted text-sm">One bad output feeds the next agent. Errors amplify through the DAG.</p>
          </div>
        </div>
      </section>

      <!-- Chaos Experiments -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Chaos Experiments for AI Workflows</h2>
        <div class="space-y-4">
          <div
            v-for="experiment in experiments"
            :key="experiment.name"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                <Icon :name="experiment.icon" class="w-5 h-5 text-red-400" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-white mb-1">{{ experiment.name }}</h3>
                <p class="text-terminal-muted text-sm mb-3">{{ experiment.description }}</p>
                <div class="flex flex-col sm:flex-row gap-2 text-xs">
                  <span class="px-2 py-1 rounded bg-red-500/20 text-red-300 font-mono">
                    Inject: {{ experiment.inject }}
                  </span>
                  <span class="px-2 py-1 rounded bg-terminal-green/20 text-terminal-green font-mono">
                    Expect: {{ experiment.expected }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Principles -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Chaos Engineering Principles</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="(principle, index) in principles"
            :key="principle.title"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-center gap-3 mb-3">
              <span class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                {{ index + 1 }}
              </span>
              <h3 class="font-semibold text-white">{{ principle.title }}</h3>
            </div>
            <p class="text-terminal-muted text-sm">{{ principle.description }}</p>
          </div>
        </div>
      </section>

      <!-- YAML Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">In Practice: Chaos Mode</h2>
        <div class="terminal-block border-red-500/30">
          <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
            <span class="text-terminal-muted text-xs font-mono">chaos-test.nika.yaml</span>
          </div>
          <pre class="text-sm leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code><span class="text-red-400"># Chaos mode enabled for resilience testing</span>
chaos:
  enabled: true
  experiments:
    - type: provider_failure
      target: anthropic
      probability: 0.3          <span class="text-terminal-cyan"># 30% chance of failure</span>

    - type: latency_injection
      target: all
      delay: 5000               <span class="text-terminal-cyan"># +5s to all requests</span>

    - type: token_exhaustion
      target: agent:analyze
      maxTokens: 500            <span class="text-terminal-cyan"># Force budget limit</span>

tasks:
  - id: analyze
    agent:
      prompt: "Analyze codebase security"
      model: claude-sonnet-4-5
      fallback:
        - model: gpt-4o
        - model: llama3.2

<span class="text-terminal-green"># Run with: nika run --chaos chaos-test.nika.yaml</span></code></pre>
        </div>
      </section>

      <!-- Research Status -->
      <section class="p-6 bg-terminal-surface/30 border border-terminal-border rounded-xl">
        <h3 class="text-lg font-semibold text-white mb-3">
          <Icon name="mdi:flask" class="w-5 h-5 inline mr-2 text-red-400" />
          Research Status
        </h3>
        <p class="text-terminal-muted text-sm mb-4">
          Chaos engineering for AI is an <strong class="text-white">emerging research area</strong>. We're exploring:
        </p>
        <ul class="space-y-2 text-sm text-terminal-muted">
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Chaos mode flag for workflows — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Failure injection experiments — <strong class="text-amber-400">In Research</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>SHAKA integration for chaos detection — <strong class="text-amber-400">In Research</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-terminal-muted" />
            <span>CI/CD chaos testing pipeline — <strong class="text-terminal-muted">Future</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts/declarative-intent" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Declarative Intent
        </NuxtLink>
        <NuxtLink to="/concepts/self-healing" class="btn-primary">
          Self-Healing Agents
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
