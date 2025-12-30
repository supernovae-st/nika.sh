<script setup lang="ts">
useSeoMeta({
  title: 'SHAKA System: The AI Advisor That Never Executes | Nika Research',
  description: 'Meet SHAKA: Nika\'s runtime sidecar that observes, analyzes, and optimizes AI workflows—without ever touching execution. 4 modes, 3 action levels, enterprise-grade cost and quality optimization. "SHAKA proposes. NIKA disposes."',
  ogTitle: 'SHAKA System: Runtime AI Advisory | Nika',
  ogDescription: 'The AI advisor that never executes. Cost optimization, quality gates, and real-time workflow analysis.',
  keywords: 'SHAKA system AI, runtime AI advisor, AI workflow optimization, cost optimization LLM, quality gates AI, runtime sidecar pattern, AI observability',
});

const modes = [
  {
    name: 'observe_only',
    description: 'Zero intervention, report only',
    default: true,
    actions: 'None - pure observation',
    icon: 'mdi:eye',
  },
  {
    name: 'live_gated_safe',
    description: 'L1 subset + short timeouts (250ms)',
    default: false,
    actions: 'Retry, Switch Model',
    icon: 'mdi:shield-check',
  },
  {
    name: 'live_gated_aggressive',
    description: 'Full L1/L2 + longer timeouts (500ms)',
    default: false,
    actions: 'All L1 + Trim Context, Early Stop',
    icon: 'mdi:lightning-bolt',
  },
  {
    name: 'ci_guard',
    description: 'CI/CD validation, snapshots',
    default: false,
    actions: 'Fail fast, capture state',
    icon: 'mdi:robot',
  },
];

const actionLevels = [
  {
    level: 'L1',
    name: 'Recovery',
    color: 'green',
    description: 'Immediate responses to detected issues',
    actions: ['RETRY', 'SWITCH_MODEL', 'PATCH_PROMPT', 'ENFORCE'],
  },
  {
    level: 'L2',
    name: 'Optimization',
    color: 'amber',
    description: 'Proactive adjustments for better performance',
    actions: ['TRIM_CONTEXT', 'CHANGE_PARALLEL', 'EARLY_STOP'],
  },
  {
    level: 'L3',
    name: 'Improvement',
    color: 'space',
    description: 'Suggestions for future runs (never runtime)',
    actions: ['PROPOSE_REFACTOR', 'PROPOSE_SPLIT', 'PROPOSE_CACHE'],
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
          <li class="text-terminal-green">SHAKA System</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-green to-green-800 flex items-center justify-center">
            <Icon name="mdi:robot-outline" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="text-xs px-2 py-1 rounded-full border bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/30">
              Design Phase
            </span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">The SHAKA System</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          <strong class="text-white">S</strong>mart <strong class="text-white">H</strong>ybrid
          <strong class="text-white">A</strong>dvisory <strong class="text-white">K</strong>ernel
          <strong class="text-white">A</strong>gent — The brain that watches but never acts.
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- Core Principle -->
        <section class="mb-12">
          <div class="bg-terminal-green/10 border border-terminal-green/20 rounded-lg p-6 text-center">
            <p class="text-2xl font-mono text-terminal-green mb-2">
              "SHAKA proposes. NIKA disposes."
            </p>
            <p class="text-terminal-muted">
              The fundamental principle: SHAKA can suggest, but never execute.
            </p>
          </div>
        </section>

        <!-- Architecture -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:sitemap" class="w-6 h-6 text-terminal-green" />
            Architecture Overview
          </h2>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code>┌─────────────────────────────────────────────────────┐
│  NIKA RUNNER (Native Infrastructure Kernel)        │
│  ROLE: Execution kernel, sole runtime authority    │
│  OWNS: DAG, Budgets, DataStore, PatchWindows       │
└─────────────────┬───────────────────────────────────┘
                  │ EventBus
                  ▼
┌─────────────────────────────────────────────────────┐
│  SHAKA SERVICE (Smart Hybrid Advisory Kernel Agent)│
│  ROLE: Runtime sidecar, observes + analyzes        │
│  NEVER: Executes, mutates state, bypasses runner   │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
        ┌────────────────┐
        │  EventLog      │  → Replay, Audit
        │  TUI (Lane)    │  → Visual feedback
        │  Reports       │  → Post-run analysis
        └────────────────┘</code></pre>
          </div>

          <p class="text-terminal-muted">
            SHAKA subscribes to events from the runner via an EventBus. It processes these events,
            runs analysis, and can request the runner to take actions — but the runner always has
            final authority to accept or reject.
          </p>
        </section>

        <!-- Operating Modes -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:tune" class="w-6 h-6 text-terminal-green" />
            Operating Modes
          </h2>

          <div class="grid gap-3">
            <div
              v-for="mode in modes"
              :key="mode.name"
              class="p-4 bg-terminal-surface rounded-lg border border-terminal-border flex items-center gap-4"
            >
              <div class="w-10 h-10 rounded-lg bg-terminal-green/10 flex items-center justify-center">
                <Icon :name="mode.icon" class="w-5 h-5 text-terminal-green" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-white">{{ mode.name }}</span>
                  <span v-if="mode.default" class="text-xs px-1.5 py-0.5 rounded bg-terminal-green/20 text-terminal-green">
                    default
                  </span>
                </div>
                <p class="text-terminal-muted text-sm">{{ mode.description }}</p>
              </div>
              <div class="text-xs text-terminal-muted">
                Actions: {{ mode.actions }}
              </div>
            </div>
          </div>
        </section>

        <!-- Action Levels -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:layers" class="w-6 h-6 text-terminal-green" />
            Action Levels
          </h2>

          <div class="space-y-4">
            <div
              v-for="level in actionLevels"
              :key="level.level"
              class="p-5 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <div class="flex items-center gap-3 mb-3">
                <span
                  class="text-xl font-bold font-mono"
                  :class="{
                    'text-terminal-green': level.color === 'green',
                    'text-amber-400': level.color === 'amber',
                    'text-space-400': level.color === 'space',
                  }"
                >
                  {{ level.level }}
                </span>
                <span class="font-semibold text-white">{{ level.name }}</span>
                <span class="text-terminal-muted text-sm">— {{ level.description }}</span>
              </div>

              <div class="flex flex-wrap gap-2">
                <span
                  v-for="action in level.actions"
                  :key="action"
                  class="font-mono text-xs px-2 py-1 rounded"
                  :class="{
                    'bg-terminal-green/10 text-terminal-green': level.color === 'green',
                    'bg-amber-500/10 text-amber-400': level.color === 'amber',
                    'bg-space-500/10 text-space-400': level.color === 'space',
                  }"
                >
                  {{ action }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p class="text-amber-300 text-sm">
              <Icon name="mdi:information" class="w-4 h-4 inline mr-1" />
              <strong>Important:</strong> L3 actions are NEVER executed at runtime. They are
              proposals written to <code>shaka.proposal.yaml</code> for human review.
            </p>
          </div>
        </section>

        <!-- Components -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:puzzle" class="w-6 h-6 text-terminal-green" />
            Internal Components (Planned)
          </h2>

          <div class="terminal-block">
            <pre class="text-sm"><code>src/shaka/
├── mod.rs           # Main entry point
├── epistemic/       # Sensing layer (signals, scoring)
├── policy/          # Governance (mitigation, budgets)
├── facets/          # Sub-advisors
│   ├── security.rs  # Security facet
│   ├── cost.rs      # Cost optimization facet
│   ├── quality.rs   # Output quality facet
│   └── perf.rs      # Performance facet
├── livegate/        # Runtime patches (L1/L2)
├── report/          # Output generation (shaka.report.json)
└── proposal/        # Improvement suggestions (.yaml + .diff)</code></pre>
          </div>
        </section>

        <!-- Key Invariants -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:lock" class="w-6 h-6 text-terminal-green" />
            Key Invariants (Non-Negotiable)
          </h2>

          <div class="bg-terminal-surface p-6 rounded-lg border border-terminal-border">
            <ul class="space-y-3">
              <li class="flex items-start gap-3">
                <Icon name="mdi:check-bold" class="w-5 h-5 text-terminal-green flex-shrink-0 mt-0.5" />
                <span class="text-terminal-text"><strong class="text-white">DAG is IMMUTABLE</strong> — No task add/remove at runtime</span>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="mdi:check-bold" class="w-5 h-5 text-terminal-green flex-shrink-0 mt-0.5" />
                <span class="text-terminal-text"><strong class="text-white">Budgets are INVIOLABLE</strong> — SHAKA cannot exceed budgets</span>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="mdi:check-bold" class="w-5 h-5 text-terminal-green flex-shrink-0 mt-0.5" />
                <span class="text-terminal-text"><strong class="text-white">Powers are INVIOLABLE</strong> — Cannot grant new permissions</span>
              </li>
              <li class="flex items-start gap-3">
                <Icon name="mdi:check-bold" class="w-5 h-5 text-terminal-green flex-shrink-0 mt-0.5" />
                <span class="text-terminal-text"><strong class="text-white">All actions LOGGED</strong> — Complete audit trail, replayable</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">SHAKA is in active design</p>
              <p class="text-terminal-muted text-sm">Help shape how it works.</p>
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
