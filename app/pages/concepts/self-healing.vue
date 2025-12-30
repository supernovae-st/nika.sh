<script setup lang="ts">
useSeoMeta({
  title: 'Self-Healing AI Agents: Autonomous Error Recovery | Nika Research',
  description: 'Build AI workflows that detect failures and fix themselves. Nika\'s self-healing agents use runtime signals to identify issues, apply corrective actions, and learn from mistakes — without human intervention.',
  ogTitle: 'Self-Healing AI Agents | Nika',
  ogDescription: 'AI workflows that detect failures and fix themselves. Autonomous error recovery for production.',
  keywords: 'self-healing AI agents, autonomous error recovery, AI self-correction, auto-remediation LLM, resilient agentic workflows, automatic failure recovery, self-repairing AI systems',
});

const healingLevels = [
  {
    level: 'L1: Retry',
    description: 'Simple retry with backoff. Works for transient failures.',
    actions: ['Immediate retry', 'Exponential backoff', 'Jitter'],
    automated: true,
    icon: 'mdi:refresh',
  },
  {
    level: 'L2: Adapt',
    description: 'Modify execution parameters based on failure type.',
    actions: ['Reduce context size', 'Switch to faster model', 'Simplify prompt'],
    automated: true,
    icon: 'mdi:tune',
  },
  {
    level: 'L3: Reroute',
    description: 'Switch execution path entirely. Different provider or strategy.',
    actions: ['Provider failover', 'Alternative workflow path', 'Cached fallback'],
    automated: true,
    icon: 'mdi:swap-horizontal',
  },
  {
    level: 'L4: Escalate',
    description: 'Human intervention required. System preserves state for resume.',
    actions: ['Alert operators', 'Preserve state', 'Provide diagnostics'],
    automated: false,
    icon: 'mdi:account-alert',
  },
];

const signals = [
  { name: 'Retry Count', threshold: '> 3', action: 'Switch model', type: 'health' },
  { name: 'Latency', threshold: '> 30s', action: 'Reduce context', type: 'performance' },
  { name: 'Token Usage', threshold: '> 90%', action: 'Compress history', type: 'budget' },
  { name: 'Parse Errors', threshold: '> 2', action: 'Patch prompt', type: 'quality' },
  { name: 'Collapse Risk', threshold: '> 70%', action: 'Trim scope', type: 'epistemic' },
  { name: 'Tool Failures', threshold: '> 50%', action: 'Disable tool', type: 'health' },
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
          <li class="text-terminal-green">Self-Healing Agents</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-green to-green-800 flex items-center justify-center">
            <Icon name="mdi:heart-pulse" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge">Design Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Self-Healing Agents</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          AI workflows that detect failures and fix themselves — automatically.
        </p>
      </header>

      <!-- Core Principle -->
      <section class="mb-12">
        <div class="terminal-block">
          <p class="text-terminal-green font-mono text-lg mb-2">
            "The best incident response is no incident at all."
          </p>
          <p class="text-terminal-muted">
            Self-healing systems don't just handle failures — they <strong class="text-white">anticipate and prevent</strong> them.
            By monitoring runtime signals and applying corrective actions automatically, Nika keeps workflows running
            without human intervention.
          </p>
        </div>
      </section>

      <!-- The Vision -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">From Reactive to Proactive</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 class="font-semibold text-red-400 mb-2">Traditional: Reactive</h4>
            <ul class="text-terminal-muted text-sm space-y-1">
              <li>Wait for failure</li>
              <li>Alert human operators</li>
              <li>Manual investigation</li>
              <li>Manual fix</li>
              <li>Manual restart</li>
            </ul>
            <p class="text-red-400 text-xs mt-2 font-mono">MTTR: Hours to Days</p>
          </div>
          <div class="p-4 bg-terminal-green/10 border border-terminal-green/20 rounded-lg">
            <h4 class="font-semibold text-terminal-green mb-2">Nika: Proactive</h4>
            <ul class="text-terminal-muted text-sm space-y-1">
              <li>Monitor health signals</li>
              <li>Detect anomalies early</li>
              <li>Apply automatic fixes</li>
              <li>Verify recovery</li>
              <li>Resume seamlessly</li>
            </ul>
            <p class="text-terminal-green text-xs mt-2 font-mono">MTTR: Seconds</p>
          </div>
        </div>
      </section>

      <!-- Healing Levels -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">The 4-Level Healing Ladder</h2>
        <div class="space-y-3">
          <div
            v-for="level in healingLevels"
            :key="level.level"
            class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                :class="level.automated ? 'bg-terminal-green/20' : 'bg-amber-500/20'"
              >
                <Icon
                  :name="level.icon"
                  class="w-5 h-5"
                  :class="level.automated ? 'text-terminal-green' : 'text-amber-400'"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-1">
                  <h4 class="font-mono font-semibold text-white">{{ level.level }}</h4>
                  <span
                    class="text-xs px-2 py-0.5 rounded"
                    :class="level.automated
                      ? 'bg-terminal-green/20 text-terminal-green'
                      : 'bg-amber-500/20 text-amber-400'"
                  >
                    {{ level.automated ? 'Automated' : 'Human Required' }}
                  </span>
                </div>
                <p class="text-terminal-muted text-sm mb-2">{{ level.description }}</p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="action in level.actions"
                    :key="action"
                    class="text-xs px-2 py-0.5 rounded bg-terminal-border text-terminal-muted"
                  >
                    {{ action }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Signal-Action Matrix -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Signal → Action Matrix</h2>
        <p class="text-terminal-muted mb-4">
          SHAKA monitors these signals and triggers automatic healing actions:
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-terminal-border">
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Signal</th>
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Threshold</th>
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Healing Action</th>
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="signal in signals"
                :key="signal.name"
                class="border-b border-terminal-border/50"
              >
                <td class="py-3 px-4 text-white font-medium">{{ signal.name }}</td>
                <td class="py-3 px-4 text-amber-400 font-mono text-xs">{{ signal.threshold }}</td>
                <td class="py-3 px-4 text-terminal-green font-mono text-xs">{{ signal.action }}</td>
                <td class="py-3 px-4">
                  <span class="text-xs px-2 py-0.5 rounded bg-terminal-border text-terminal-muted">
                    {{ signal.type }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- YAML Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">In Practice: Healing Policies</h2>
        <div class="terminal-block">
          <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
            <span class="text-terminal-muted text-xs font-mono">self-healing.nika.yaml</span>
          </div>
          <pre class="text-sm leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>shaka:
  mode: live_gated_safe        <span class="text-terminal-cyan"># Enable automatic healing</span>

  healing:
    enabled: true
    policies:
      - signal: retry_count
        threshold: 3
        action: switch_model
        fallback: claude-haiku

      - signal: latency
        threshold: 30000        <span class="text-terminal-cyan"># 30s</span>
        action: reduce_context
        trim: 50%

      - signal: collapse_risk
        threshold: 7000         <span class="text-terminal-cyan"># 70% on 0-10000 scale</span>
        action: isolate_scope
        preset: minimal

      - signal: tool_errors
        threshold: 0.5          <span class="text-terminal-cyan"># 50% failure rate</span>
        action: disable_tool
        notify: true

tasks:
  - id: analyze
    agent:
      prompt: "Analyze codebase"
      tools: [Read, Grep, Glob]
      maxTurns: 10

<span class="text-terminal-green"># SHAKA monitors and heals automatically</span></code></pre>
        </div>
      </section>

      <!-- SHAKA Integration -->
      <section class="mb-12 p-4 bg-space-500/10 border border-space-500/20 rounded-lg">
        <h4 class="font-semibold text-space-300 mb-2">
          <Icon name="mdi:robot-outline" class="w-4 h-4 inline mr-1" />
          Powered by SHAKA
        </h4>
        <p class="text-terminal-muted text-sm">
          Self-healing is implemented through the <NuxtLink to="/concepts/shaka-system" class="text-space-400 underline">SHAKA System</NuxtLink> —
          Nika's runtime sidecar that observes, analyzes, and proposes actions. SHAKA detects issues before they cascade
          and applies L1/L2 healing actions automatically, while respecting the core invariant:
          <strong class="text-white">"SHAKA proposes. NIKA disposes."</strong>
        </p>
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
            <span>Retry with backoff — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Timeout handling — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>SHAKA signal monitoring — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Automatic healing policies — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-terminal-muted" />
            <span>Learning from corrections — <strong class="text-terminal-muted">Future</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts/chaos-engineering" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Chaos Engineering
        </NuxtLink>
        <NuxtLink to="/concepts/observability-driven" class="btn-primary">
          Observability-Driven
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
