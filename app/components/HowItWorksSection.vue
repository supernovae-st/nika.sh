<script setup lang="ts">
const steps = [
  {
    number: '01',
    title: 'Define Your Workflow',
    description: 'Write your agentic workflow in YAML. Define agents, tools, and how data flows between tasks.',
    code: `# Define agents and their capabilities
agent:
  model: claude-sonnet-4-5
  tools: [Read, Write, Grep]

tasks:
  - id: analyze
    agent:
      prompt: "Analyze this codebase"`,
  },
  {
    number: '02',
    title: 'Run with One Command',
    description: 'Execute your workflow with a single CLI command. Real-time streaming, progress tracking, and beautiful output.',
    code: `$ nika run workflow.nika.yaml

◉ Running workflow: code-review
├─ ◎ analyze [minimal] ............ ✓
├─ ◈ review  [default] ............ ●
└─ ◎ report  [minimal] ............ ○

[████████████░░░░░░░░] 60% | ETA: 12s`,
  },
  {
    number: '03',
    title: 'Get Structured Output',
    description: 'Every workflow produces structured, typed outputs. JSON, Markdown, or custom schemas. Ready for automation.',
    code: `# Output stored in DataStore
{
  "analyze": {
    "issues": 3,
    "suggestions": [...],
    "severity": "medium"
  },
  "review": {
    "approved": true,
    "comments": [...]
  }
}`,
  },
];
</script>

<template>
  <section id="how-it-works" class="py-20 relative bg-terminal-surface/30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="badge mb-4">How It Works</span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          From YAML to
          <span class="gradient-text">Autonomous Execution</span>
        </h2>
        <p class="text-terminal-muted text-lg">
          Three simple steps to automate any AI workflow
        </p>
      </div>

      <!-- Steps -->
      <div class="space-y-16">
        <div
          v-for="(step, index) in steps"
          :key="step.number"
          class="grid lg:grid-cols-2 gap-8 items-center"
          :class="{ 'lg:flex-row-reverse': index % 2 === 1 }"
        >
          <!-- Content -->
          <div :class="{ 'lg:order-2': index % 2 === 1 }" class="space-y-4">
            <div class="flex items-center gap-4">
              <span class="text-5xl font-bold text-space-500/30">{{ step.number }}</span>
              <h3 class="text-2xl font-bold text-white">{{ step.title }}</h3>
            </div>
            <p class="text-terminal-muted text-lg leading-relaxed">
              {{ step.description }}
            </p>
          </div>

          <!-- Code block -->
          <div :class="{ 'lg:order-1': index % 2 === 1 }">
            <div class="terminal-block">
              <pre class="text-sm leading-relaxed overflow-x-auto"><code>{{ step.code }}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
