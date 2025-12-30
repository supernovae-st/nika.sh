<script setup lang="ts">
const features = [
  {
    icon: 'heroicons:cpu-chip',
    title: 'Multi-Agent Orchestration',
    description: 'Deploy autonomous AI agents that collaborate on complex tasks. 5 semantic verbs for precise workflow control.',
    highlight: '5 Verbs',
  },
  {
    icon: 'heroicons:code-bracket',
    title: 'Workflow-as-Code',
    description: 'Define entire AI pipelines in readable YAML. Git-friendly, portable, and ready to share.',
    highlight: 'YAML First',
  },
  {
    icon: 'heroicons:arrows-right-left',
    title: 'Any LLM, Zero Lock-in',
    description: 'Switch between Claude, GPT-4, Gemini, or Ollama with one line. Mix providers freely.',
    highlight: '4+ Providers',
  },
  {
    icon: 'heroicons:share',
    title: 'DAG Execution Engine',
    description: 'Deterministic execution with auto-parallelization. Fan-out/fan-in patterns built-in.',
    highlight: '10x Faster',
  },
  {
    icon: 'heroicons:shield-check',
    title: '3D Scope Isolation',
    description: 'Revolutionary context control across DAG position, transcript history, and state exposure.',
    highlight: '4 Presets',
  },
  {
    icon: 'heroicons:command-line',
    title: 'Developer-First CLI',
    description: 'Beautiful TUI with real-time streaming and progress tracking. Built in Rust for speed.',
    highlight: 'Rust',
  },
];
</script>

<template>
  <section id="features" class="py-24 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="section-header">
        <span class="badge badge-accent mb-4">
          <Icon name="heroicons:sparkles-solid" class="w-4 h-4" />
          Core Features
        </span>
        <h2 class="section-title">
          Enterprise-Grade AI Automation
        </h2>
        <p class="section-subtitle">
          From single-agent tasks to complex multi-model pipelines.
          Production-ready from day one.
        </p>
      </div>

      <!-- Features grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="feature-card group"
        >
          <!-- Icon + highlight -->
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-space-500/10 border border-space-500/20 flex items-center justify-center group-hover:bg-space-500/20 transition-colors">
              <Icon :name="feature.icon" class="w-6 h-6 text-space-400" />
            </div>
            <span class="text-xs font-mono px-2 py-1 rounded bg-terminal-elevated text-terminal-muted border border-terminal-border">
              {{ feature.highlight }}
            </span>
          </div>

          <!-- Content -->
          <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-space-400 transition-colors">
            {{ feature.title }}
          </h3>
          <p class="text-terminal-muted text-sm leading-relaxed">
            {{ feature.description }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
