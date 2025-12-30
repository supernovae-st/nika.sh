<script setup lang="ts">
const useCases = [
  {
    title: 'Code Review Automation',
    description: 'Automate PR reviews with multi-agent analysis. Security scanner, code quality checker, and documentation validator working together.',
    icon: 'mdi:source-pull',
    tags: ['CI/CD', 'DevOps', 'Quality'],
  },
  {
    title: 'Content Generation Pipeline',
    description: 'Research, write, edit, and publish content with a chain of specialized agents. Human review gates where you need them.',
    icon: 'mdi:file-document-edit',
    tags: ['Marketing', 'SEO', 'Content'],
  },
  {
    title: 'Data Processing Workflows',
    description: 'Extract, transform, and analyze data with AI agents. Schema validation, error handling, and structured outputs built-in.',
    icon: 'mdi:database-cog',
    tags: ['ETL', 'Analytics', 'Data'],
  },
  {
    title: 'Testing & QA Automation',
    description: 'Generate test cases, run coverage analysis, and identify edge cases with agentic testing pipelines.',
    icon: 'mdi:test-tube',
    tags: ['Testing', 'QA', 'Coverage'],
  },
  {
    title: 'Documentation Generation',
    description: 'Auto-generate API docs, README files, and technical guides from your codebase. Always up-to-date.',
    icon: 'mdi:book-open-page-variant',
    tags: ['Docs', 'API', 'Developer'],
  },
  {
    title: 'Multi-Provider Comparison',
    description: 'Run the same prompt through multiple LLMs and compare results. Find the best model for your use case.',
    icon: 'mdi:compare',
    tags: ['Evaluation', 'Benchmarks', 'LLM'],
  },
];
</script>

<template>
  <section id="use-cases" class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="badge mb-4">Use Cases</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Built for
          <span class="gradient-text">Real-World Automation</span>
        </h2>
        <p class="text-terminal-muted text-lg">
          From simple scripts to complex multi-agent systems
        </p>
      </div>

      <!-- Use cases grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="useCase in useCases"
          :key="useCase.title"
          class="feature-card"
        >
          <!-- Icon -->
          <div class="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Icon :name="useCase.icon" class="w-5 h-5 text-amber-400" />
          </div>

          <!-- Content -->
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ useCase.title }}
          </h3>
          <p class="text-terminal-muted text-sm leading-relaxed mb-4">
            {{ useCase.description }}
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="tag in useCase.tags"
              :key="tag"
              class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
            >
              {{ tag }}
            </span>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
