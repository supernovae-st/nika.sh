<script setup lang="ts">
useSeoMeta({
  title: 'Observability-Driven Development: AI Workflows You Can Actually Debug | Nika Research',
  description: 'Build observable AI workflows from day one. Traces, spans, metrics, and structured logging for every agent, tool call, and decision. OpenTelemetry-compatible. Debug non-deterministic AI like never before.',
  ogTitle: 'Observability-Driven Development for AI | Nika',
  ogDescription: 'Traces, spans, metrics for AI workflows. Debug LLMs like you debug code.',
  keywords: 'AI observability, LLM monitoring, traces spans metrics AI, OpenTelemetry AI, agentic workflow debugging, AI system monitoring, production AI observability',
});

const signals = [
  {
    name: 'Traces',
    icon: 'mdi:timeline',
    description: 'End-to-end request flow through the DAG. See exactly how tasks connect and data flows.',
    example: 'workflow.run → task.analyze → agent.call → tool.read → agent.response',
    color: 'space',
  },
  {
    name: 'Spans',
    icon: 'mdi:arrow-expand-horizontal',
    description: 'Individual operations with timing, parent-child relationships, and attributes.',
    example: 'span: llm.call | duration: 2.3s | tokens: 4521 | model: claude-sonnet',
    color: 'cyan',
  },
  {
    name: 'Metrics',
    icon: 'mdi:chart-line',
    description: 'Aggregated measurements: latency percentiles, token usage, error rates, costs.',
    example: 'p99_latency: 4.2s | tokens_per_task: 8500 | error_rate: 0.02',
    color: 'amber',
  },
  {
    name: 'Logs',
    icon: 'mdi:text-box',
    description: 'Structured events with context. Every decision, every tool call, every output.',
    example: '{"level":"info","task":"analyze","action":"tool_call","tool":"Read"}',
    color: 'green',
  },
];

const challenges = [
  {
    problem: 'Non-Deterministic Outputs',
    traditional: 'Same input, different outputs. Hard to reproduce bugs.',
    solution: 'Capture full context: prompt, temperature, seed, model version.',
  },
  {
    problem: 'Hidden Reasoning',
    traditional: 'LLMs are black boxes. Why did it make that decision?',
    solution: 'Trace chain-of-thought, tool selections, and intermediate outputs.',
  },
  {
    problem: 'Cascading Failures',
    traditional: 'Error in task 3 causes task 7 to fail. Root cause is obscured.',
    solution: 'Span parent-child relationships show exact failure propagation.',
  },
  {
    problem: 'Cost Attribution',
    traditional: 'API bill is $5000. Which workflow is responsible?',
    solution: 'Per-task token metrics with cost attribution and anomaly detection.',
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
          <li class="text-space-400">Observability-Driven</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-space-600 to-space-800 flex items-center justify-center">
            <Icon name="mdi:monitor-eye" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge">Design Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Observability-Driven Development</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          If you can't observe it, you can't debug it. If you can't debug it, you can't ship it.
        </p>
      </header>

      <!-- Core Principle -->
      <section class="mb-12">
        <div class="terminal-block">
          <p class="text-space-400 font-mono text-lg mb-2">
            "Observability is not optional — it's the control plane for AI."
          </p>
          <p class="text-terminal-muted">
            Traditional logging captures what happened. <strong class="text-white">Observability</strong> captures
            why it happened, how long it took, what it cost, and whether it worked. For non-deterministic AI systems,
            this isn't a nice-to-have — it's the only way to understand and improve your workflows.
          </p>
        </div>
      </section>

      <!-- Four Pillars -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">The Four Pillars of AI Observability</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="signal in signals"
            :key="signal.name"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-center gap-3 mb-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :class="{
                  'bg-space-500/20': signal.color === 'space',
                  'bg-terminal-cyan/20': signal.color === 'cyan',
                  'bg-amber-500/20': signal.color === 'amber',
                  'bg-terminal-green/20': signal.color === 'green',
                }"
              >
                <Icon
                  :name="signal.icon"
                  class="w-5 h-5"
                  :class="{
                    'text-space-400': signal.color === 'space',
                    'text-terminal-cyan': signal.color === 'cyan',
                    'text-amber-400': signal.color === 'amber',
                    'text-terminal-green': signal.color === 'green',
                  }"
                />
              </div>
              <h3 class="font-semibold text-white">{{ signal.name }}</h3>
            </div>
            <p class="text-terminal-muted text-sm mb-3">{{ signal.description }}</p>
            <code class="text-xs bg-terminal-border px-2 py-1 rounded text-terminal-muted block overflow-x-auto">
              {{ signal.example }}
            </code>
          </div>
        </div>
      </section>

      <!-- Why AI is Different -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Why AI Observability is Different</h2>
        <div class="space-y-4">
          <div
            v-for="challenge in challenges"
            :key="challenge.problem"
            class="p-4 bg-terminal-surface/50 border border-terminal-border rounded-lg"
          >
            <h4 class="font-semibold text-white mb-2">{{ challenge.problem }}</h4>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-red-400 text-xs font-mono block mb-1">TRADITIONAL:</span>
                <p class="text-terminal-muted">{{ challenge.traditional }}</p>
              </div>
              <div>
                <span class="text-terminal-green text-xs font-mono block mb-1">OBSERVABLE:</span>
                <p class="text-terminal-muted">{{ challenge.solution }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- OpenTelemetry -->
      <section class="mb-12 p-4 bg-space-500/10 border border-space-500/20 rounded-lg">
        <h4 class="font-semibold text-space-300 mb-2">
          <Icon name="mdi:open-source-initiative" class="w-4 h-4 inline mr-1" />
          OpenTelemetry Compatible
        </h4>
        <p class="text-terminal-muted text-sm">
          Nika exports traces, spans, and metrics in <strong class="text-white">OpenTelemetry format</strong> —
          the industry standard for observability. Export to Jaeger, Zipkin, Datadog, Honeycomb, Grafana, or any
          OTLP-compatible backend. No vendor lock-in for your observability stack either.
        </p>
      </section>

      <!-- What We Capture -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">What Nika Captures</h2>
        <div class="terminal-block">
          <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
            <span class="text-terminal-muted text-xs font-mono">trace-example.json</span>
          </div>
          <pre class="text-xs leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>{
  "traceId": "abc123...",
  "spans": [
    {
      "name": "workflow.run",
      "duration": "45.2s",
      "attributes": {
        "workflow.id": "code-review",
        "workflow.tasks": 5,
        "workflow.provider": "anthropic"
      },
      "children": [
        {
          "name": "task.analyze",
          "duration": "12.3s",
          "attributes": {
            "task.id": "analyze",
            "task.scope": "minimal",
            "agent.model": "claude-sonnet-4-5",
            "agent.tokens.input": 4521,
            "agent.tokens.output": 1823,
            "agent.cost": 0.024,
            "agent.turns": 3
          },
          "children": [
            {
              "name": "tool.Read",
              "duration": "0.8s",
              "attributes": {
                "tool.path": "src/main.rs",
                "tool.bytes": 12456
              }
            }
          ]
        }
      ]
    }
  ],
  "metrics": {
    "total_cost": 0.087,
    "total_tokens": 23456,
    "p99_latency": "18.2s",
    "error_rate": 0.0
  }
}</code></pre>
        </div>
      </section>

      <!-- TUI Integration -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-4">Real-Time in the TUI</h2>
        <p class="text-terminal-muted mb-4">
          Nika's terminal UI shows observability data in real-time as workflows execute:
        </p>
        <div class="terminal-block">
          <pre class="text-xs leading-relaxed font-mono text-terminal-text overflow-x-auto"><code>┌─ Workflow: code-review ─────────────────────────────────────┐
│                                                             │
│  ◎ analyze  [minimal]  ████████████░░░░░  12.3s  $0.024    │
│    ├─ Read(src/main.rs)      0.8s                          │
│    ├─ Grep(TODO|FIXME)       0.3s                          │
│    └─ LLM(claude-sonnet)    11.2s  4521→1823 tokens        │
│                                                             │
│  ◈ review   [default]  ████░░░░░░░░░░░░░   4.1s  $0.012    │
│    └─ LLM(claude-sonnet)     4.1s  processing...           │
│                                                             │
│  ◎ report   [minimal]  ░░░░░░░░░░░░░░░░░  pending          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Tokens: 6,344  │  Cost: $0.036  │  Time: 16.4s            │
└─────────────────────────────────────────────────────────────┘</code></pre>
        </div>
      </section>

      <!-- Research Status -->
      <section class="p-6 bg-terminal-surface/30 border border-terminal-border rounded-xl">
        <h3 class="text-lg font-semibold text-white mb-3">
          <Icon name="mdi:flask" class="w-5 h-5 inline mr-2 text-space-400" />
          Implementation Status
        </h3>
        <ul class="space-y-2 text-sm text-terminal-muted">
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Real-time TUI with progress — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Token and cost tracking — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>Structured trace output — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-amber-400" />
            <span>OpenTelemetry export — <strong class="text-amber-400">In Design</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-blank-outline" class="w-4 h-4 text-terminal-muted" />
            <span>Historical trace storage — <strong class="text-terminal-muted">Future</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts/self-healing" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Self-Healing Agents
        </NuxtLink>
        <NuxtLink to="/concepts" class="btn-primary">
          All Concepts
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
