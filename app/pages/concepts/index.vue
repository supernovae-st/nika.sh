<script setup lang="ts">
useSeoMeta({
  title: 'Research & Concepts: 13 Scientific Principles Behind Nika | AI Workflow Innovation',
  description: 'Explore 13 research concepts powering Nika: Epistemic Awareness, Antifragility, Bounded Rationality, Graceful Degradation, Chaos Engineering, Self-Healing Agents, Observability-Driven Development, and more. Building production-grade AI automation on science.',
  ogTitle: 'Research & Concepts | Nika',
  ogDescription: '13 research concepts behind the most advanced agentic CLI. Science-driven AI workflow automation.',
  keywords: 'epistemic awareness AI, antifragile AI systems, bounded rationality LLM, graceful degradation AI, chaos engineering AI, self-healing agents, observability AI workflows, declarative intent automation',
});

const concepts = [
  {
    slug: 'epistemic-awareness',
    title: 'Epistemic Awareness',
    subtitle: 'Making AI Know What It Knows',
    description: 'A framework for AI systems to understand their own knowledge boundaries, detect hallucination risks, and signal uncertainty in real-time.',
    icon: 'mdi:brain',
    color: 'space',
    status: 'research',
    tags: ['Hallucination Prevention', 'Uncertainty Quantification', 'Runtime Signals'],
  },
  {
    slug: 'antifragility',
    title: 'Antifragile Workflows',
    subtitle: 'Systems That Get Stronger From Stress',
    description: 'Inspired by Nassim Taleb\'s work, we\'re exploring how AI workflows can become more robust through exposure to failures, not despite them.',
    icon: 'mdi:lightning-bolt',
    color: 'amber',
    status: 'exploration',
    tags: ['Resilience', 'Self-Healing', 'Chaos Engineering'],
  },
  {
    slug: 'scope-isolation',
    title: 'Scope Isolation',
    subtitle: 'The 3D Context Architecture',
    description: 'A novel approach to managing AI agent context across three dimensions: DAG position, transcript history, and state exposure.',
    icon: 'mdi:cube-outline',
    color: 'cyan',
    status: 'implemented',
    tags: ['Context Windows', 'Agent Isolation', 'Security'],
  },
  {
    slug: 'shaka-system',
    title: 'The SHAKA System',
    subtitle: 'Smart Hybrid Advisory Kernel Agent',
    description: 'A runtime sidecar that observes, analyzes, and proposes optimizations without ever executing. "SHAKA proposes. NIKA disposes."',
    icon: 'mdi:robot-outline',
    color: 'green',
    status: 'design',
    tags: ['Runtime Advisor', 'Cost Optimization', 'Quality Gates'],
  },
  {
    slug: 'dag-execution',
    title: 'DAG Execution Engine',
    subtitle: 'Deterministic Workflow Orchestration',
    description: 'Directed Acyclic Graphs for predictable, parallel AI workflow execution. Maximum control with automatic parallelization.',
    icon: 'mdi:sitemap',
    color: 'space',
    status: 'implemented',
    tags: ['Parallel Processing', 'Deterministic', 'Production-Ready'],
  },
  {
    slug: 'context-engineering',
    title: 'Context Engineering',
    subtitle: 'Token Optimization for AI Agents',
    description: 'Advanced context window management: observation masking, trajectory compression, and smart token allocation based on latest research.',
    icon: 'mdi:text-box-multiple',
    color: 'amber',
    status: 'research',
    tags: ['Token Optimization', 'Cost Reduction', 'Memory Management'],
  },
  {
    slug: 'multi-provider',
    title: 'Multi-Provider Orchestration',
    subtitle: 'One Workflow, Any LLM',
    description: 'Seamless switching between Claude, GPT-4, Gemini, and local models. No vendor lock-in, intelligent routing, cost optimization.',
    icon: 'mdi:swap-horizontal',
    color: 'cyan',
    status: 'implemented',
    tags: ['Vendor Agnostic', 'Claude', 'GPT-4', 'Gemini', 'Ollama'],
  },
  // New concepts from advanced research
  {
    slug: 'bounded-rationality',
    title: 'Bounded Rationality',
    subtitle: 'AI That Knows Its Limits',
    description: 'Herbert Simon\'s satisficing principle applied to AI agents. Find good-enough solutions fast, rather than exhaustively searching for optimal ones.',
    icon: 'mdi:brain',
    color: 'amber',
    status: 'research',
    tags: ['Herbert Simon', 'Satisficing', 'Cognitive Limits', 'Budget Constraints'],
  },
  {
    slug: 'graceful-degradation',
    title: 'Graceful Degradation',
    subtitle: 'Workflows That Bend, Never Break',
    description: 'When components fail, maintain core functionality. Model fallbacks, provider switching, and automatic recovery paths.',
    icon: 'mdi:shield-sync',
    color: 'green',
    status: 'design',
    tags: ['Fallback Strategies', 'Provider Switching', 'Resilience'],
  },
  {
    slug: 'declarative-intent',
    title: 'Declarative Intent',
    subtitle: 'Describe What, Not How',
    description: 'YAML-first philosophy: declare your desired outcome, let the engine handle execution. 60% less code than imperative frameworks.',
    icon: 'mdi:file-code',
    color: 'cyan',
    status: 'implemented',
    tags: ['YAML-First', 'Intent-Driven', 'Low-Code', 'Composable'],
  },
  {
    slug: 'chaos-engineering',
    title: 'Chaos Engineering',
    subtitle: 'Break Things on Purpose',
    description: 'Netflix-inspired resilience testing for AI workflows. Inject failures, test fallbacks, validate recovery before production breaks.',
    icon: 'mdi:lightning-bolt',
    color: 'red',
    status: 'exploration',
    tags: ['Fault Injection', 'Resilience Testing', 'Netflix', 'Chaos Monkey'],
  },
  {
    slug: 'self-healing',
    title: 'Self-Healing Agents',
    subtitle: 'Autonomous Error Recovery',
    description: 'AI workflows that detect failures and fix themselves. Runtime signals trigger automatic healing actions without human intervention.',
    icon: 'mdi:heart-pulse',
    color: 'green',
    status: 'design',
    tags: ['Auto-Recovery', 'SHAKA Integration', 'Autonomous', 'Proactive'],
  },
  {
    slug: 'observability-driven',
    title: 'Observability-Driven Development',
    subtitle: 'If You Can\'t Observe It, You Can\'t Debug It',
    description: 'Traces, spans, metrics, and structured logging for every agent. OpenTelemetry-compatible. Debug non-deterministic AI like never before.',
    icon: 'mdi:monitor-eye',
    color: 'space',
    status: 'design',
    tags: ['OpenTelemetry', 'Traces', 'Metrics', 'Debugging'],
  },
];

const statusLabels = {
  research: { label: 'Active Research', class: 'bg-space-500/20 text-space-300 border-space-500/30' },
  exploration: { label: 'Exploration Phase', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  implemented: { label: 'Implemented', class: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30' },
  design: { label: 'Design Phase', class: 'bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/30' },
};

const colorClasses = {
  space: 'from-space-600 to-space-800',
  amber: 'from-amber-600 to-amber-800',
  cyan: 'from-terminal-cyan to-cyan-800',
  green: 'from-terminal-green to-green-800',
  red: 'from-red-600 to-red-800',
};
</script>

<template>
  <div class="min-h-screen pt-24 pb-20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 badge mb-4">
          <Icon name="mdi:flask" class="w-4 h-4" />
          <span>Research & Development</span>
        </div>

        <h1 class="text-4xl sm:text-5xl font-bold text-white mb-6">
          The Science Behind
          <span class="gradient-text">Nika</span>
        </h1>

        <p class="text-lg text-terminal-muted leading-relaxed">
          We're not just building another CLI tool. We're researching new approaches to make AI workflows
          <strong class="text-white">safer</strong>, <strong class="text-white">more predictable</strong>,
          and <strong class="text-white">genuinely useful</strong> for developers.
        </p>

        <div class="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p class="text-amber-300 text-sm">
            <Icon name="mdi:information" class="w-4 h-4 inline mr-1" />
            <strong>Note:</strong> This is ongoing research. Not everything described here will make it into v1.0.
            We're sharing our thinking openly to gather feedback and find collaborators.
          </p>
        </div>
      </div>

      <!-- Concepts grid -->
      <div class="grid md:grid-cols-2 gap-6">
        <NuxtLink
          v-for="concept in concepts"
          :key="concept.slug"
          :to="`/concepts/${concept.slug}`"
          class="group relative p-6 rounded-xl bg-terminal-surface/50 border border-terminal-border hover:border-space-500/30 transition-all duration-300"
        >
          <!-- Icon -->
          <div
            class="w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
            :class="colorClasses[concept.color as keyof typeof colorClasses]"
          >
            <Icon :name="concept.icon" class="w-7 h-7 text-white" />
          </div>

          <!-- Status badge -->
          <span
            class="absolute top-6 right-6 text-xs px-2 py-1 rounded-full border"
            :class="statusLabels[concept.status as keyof typeof statusLabels].class"
          >
            {{ statusLabels[concept.status as keyof typeof statusLabels].label }}
          </span>

          <!-- Content -->
          <h2 class="text-xl font-bold text-white mb-1 group-hover:text-space-400 transition-colors">
            {{ concept.title }}
          </h2>
          <p class="text-terminal-muted text-sm mb-3">{{ concept.subtitle }}</p>
          <p class="text-terminal-text text-sm leading-relaxed mb-4">
            {{ concept.description }}
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in concept.tags"
              :key="tag"
              class="text-xs px-2 py-0.5 rounded bg-terminal-border text-terminal-muted"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Arrow -->
          <Icon
            name="mdi:arrow-right"
            class="absolute bottom-6 right-6 w-5 h-5 text-terminal-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
          />
        </NuxtLink>
      </div>

      <!-- Call to action -->
      <div class="mt-16 text-center">
        <p class="text-terminal-muted mb-4">
          Interested in our research? Want to contribute?
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/SuperNovae-studio/nika/discussions"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary"
          >
            <Icon name="mdi:forum" class="w-5 h-5" />
            Join the Discussion
          </a>
          <a href="/#get-started" class="btn-primary">
            <Icon name="mdi:email-outline" class="w-5 h-5" />
            Get Research Updates
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
