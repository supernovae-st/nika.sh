<script setup lang="ts">
useSeoMeta({
  title: 'Bounded Rationality: Satisficing AI That Knows Its Limits | Nika Research',
  description: 'Apply Herbert Simon\'s bounded rationality to AI agents. Nika implements satisficing decision-making: agents find good-enough solutions fast, rather than exhaustively searching for optimal ones. Realistic AI for production workflows.',
  ogTitle: 'Bounded Rationality in AI Agents | Nika',
  ogDescription: 'AI agents that know their limits. Satisficing over optimizing. Herbert Simon meets LLM orchestration.',
  keywords: 'bounded rationality AI, satisficing LLM, Herbert Simon AI agents, realistic AI decision making, cognitive limits AI, good enough solutions AI, pragmatic AI workflows',
});

const principles = [
  {
    title: 'Satisficing Over Optimizing',
    description: 'Agents find "good enough" solutions quickly rather than exhaustively searching for optimal ones. First acceptable answer wins.',
    icon: 'mdi:check-circle',
    simonQuote: '"Satisficing = Satisfy + Suffice"',
  },
  {
    title: 'Cognitive Budget Limits',
    description: 'Each agent has explicit token budgets, turn limits, and timeout constraints. No infinite loops, no runaway costs.',
    icon: 'mdi:timer-sand',
    simonQuote: '"Bounded by computational capacity"',
  },
  {
    title: 'Heuristic Decision Rules',
    description: 'Simple rules beat complex optimization under uncertainty. Agents use fast-and-frugal heuristics for routing and fallback.',
    icon: 'mdi:lightning-bolt',
    simonQuote: '"Use of heuristics to reduce complexity"',
  },
  {
    title: 'Explicit Uncertainty',
    description: 'Agents acknowledge what they don\'t know. Epistemic signals surface uncertainty rather than hiding it in confidence scores.',
    icon: 'mdi:help-circle',
    simonQuote: '"Incomplete information is the norm"',
  },
];

const comparisons = [
  { aspect: 'Goal', traditional: 'Find optimal solution', bounded: 'Find acceptable solution fast' },
  { aspect: 'Resources', traditional: 'Unlimited compute', bounded: 'Explicit budgets & limits' },
  { aspect: 'Uncertainty', traditional: 'Hidden in probabilities', bounded: 'Surfaced as signals' },
  { aspect: 'Failure', traditional: 'Retry until success', bounded: 'Fail fast, escalate early' },
  { aspect: 'Complexity', traditional: 'Handle all edge cases', bounded: 'Handle common cases well' },
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
          <li class="text-amber-400">Bounded Rationality</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
            <Icon name="mdi:brain" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge-amber">Research Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Bounded Rationality</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          AI agents that know their limits — and work brilliantly within them.
        </p>
      </header>

      <!-- Attribution -->
      <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-12">
        <p class="text-amber-300 text-sm">
          <Icon name="mdi:account-school" class="w-4 h-4 inline mr-1" />
          <strong>Herbert A. Simon (1916-2001)</strong> — Nobel laureate in Economics, Turing Award winner.
          His work on bounded rationality revolutionized how we think about decision-making under constraints.
          Nika applies these principles to AI agent orchestration.
        </p>
      </div>

      <!-- The Problem -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">The Problem with "Optimal" AI</h2>
        <p class="text-terminal-muted leading-relaxed mb-4">
          Most AI frameworks assume unlimited resources: infinite context windows, unlimited API calls,
          perfect information. But <strong class="text-white">production systems have real constraints</strong>:
        </p>
        <ul class="space-y-2 text-terminal-muted">
          <li class="flex items-start gap-2">
            <Icon name="mdi:close-circle" class="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <span>Token budgets run out mid-reasoning</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="mdi:close-circle" class="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <span>API rate limits throttle parallel agents</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="mdi:close-circle" class="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <span>Context windows can't hold all relevant information</span>
          </li>
          <li class="flex items-start gap-2">
            <Icon name="mdi:close-circle" class="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <span>Latency constraints demand fast decisions</span>
          </li>
        </ul>
      </section>

      <!-- Simon's Solution -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Simon's Solution: Satisficing</h2>
        <div class="terminal-block mb-6">
          <p class="text-terminal-cyan font-mono text-lg">
            "Satisficing = Satisfy + Suffice"
          </p>
          <p class="text-terminal-muted mt-2">
            Instead of searching for the <em>best</em> answer, find the <em>first good enough</em> answer.
            Stop when you hit an acceptable threshold, not when you've exhausted all options.
          </p>
        </div>
        <p class="text-terminal-muted leading-relaxed">
          This isn't settling for mediocrity — it's <strong class="text-white">recognizing that perfect is the enemy of shipped</strong>.
          In agentic workflows, a fast acceptable result beats a slow optimal one every time.
        </p>
      </section>

      <!-- Principles -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">How Nika Implements Bounded Rationality</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="principle in principles"
            :key="principle.title"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Icon :name="principle.icon" class="w-5 h-5 text-amber-400" />
              </div>
              <h3 class="font-semibold text-white">{{ principle.title }}</h3>
            </div>
            <p class="text-terminal-muted text-sm mb-2">{{ principle.description }}</p>
            <p class="text-amber-400/70 text-xs font-mono italic">{{ principle.simonQuote }}</p>
          </div>
        </div>
      </section>

      <!-- Comparison Table -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Traditional vs Bounded AI Agents</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-terminal-border">
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Aspect</th>
                <th class="text-left py-3 px-4 text-red-400 font-medium">Traditional AI</th>
                <th class="text-left py-3 px-4 text-terminal-green font-medium">Bounded Rationality</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in comparisons"
                :key="row.aspect"
                class="border-b border-terminal-border/50"
              >
                <td class="py-3 px-4 text-white font-medium">{{ row.aspect }}</td>
                <td class="py-3 px-4 text-terminal-muted">{{ row.traditional }}</td>
                <td class="py-3 px-4 text-terminal-muted">{{ row.bounded }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- YAML Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">In Practice: Budget Constraints</h2>
        <div class="terminal-block">
          <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
            <span class="text-terminal-muted text-xs font-mono">bounded-agent.nika.yaml</span>
          </div>
          <pre class="text-sm leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>tasks:
  - id: analyze
    agent:
      prompt: "Analyze this codebase for security issues"
      model: claude-sonnet-4-5
      scopePreset: minimal      <span class="text-terminal-cyan"># Fresh context, no accumulation</span>
      maxTurns: 10              <span class="text-amber-400"># Hard limit: satisfice by turn 10</span>
      timeout: 30000            <span class="text-amber-400"># 30s max: good enough beats perfect</span>
      tools: [Read, Grep]       <span class="text-terminal-cyan"># Limited tools = faster decisions</span>

  - id: fallback
    agent:
      prompt: "Quick security scan, top 3 issues only"
      model: claude-haiku       <span class="text-amber-400"># Cheaper, faster fallback</span>
      maxTurns: 3               <span class="text-amber-400"># Ultra-bounded for speed</span>

flows:
  - source: analyze
    target: fallback
    condition: timeout          <span class="text-terminal-cyan"># If main agent times out, satisfice</span></code></pre>
        </div>
      </section>

      <!-- Research Status -->
      <section class="p-6 bg-terminal-surface/30 border border-terminal-border rounded-xl">
        <h3 class="text-lg font-semibold text-white mb-3">
          <Icon name="mdi:flask" class="w-5 h-5 inline mr-2 text-amber-400" />
          Research Status
        </h3>
        <p class="text-terminal-muted text-sm leading-relaxed mb-4">
          Bounded rationality principles inform Nika's design philosophy. We're actively researching:
        </p>
        <ul class="space-y-2 text-sm text-terminal-muted">
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Budget enforcement (maxTurns, timeout) — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Scope isolation for cognitive limits — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Adaptive satisficing thresholds — <strong class="text-amber-400">In Research</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Heuristic-based routing decisions — <strong class="text-amber-400">In Research</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          All Concepts
        </NuxtLink>
        <NuxtLink to="/concepts/graceful-degradation" class="btn-primary">
          Graceful Degradation
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
