<script setup lang="ts">
// Comparison with popular agentic frameworks
const tools = [
  { name: 'Nika', highlight: true },
  { name: 'LangChain' },
  { name: 'CrewAI' },
  { name: 'AutoGen' },
];

const features = [
  {
    category: 'Configuration',
    items: [
      { name: 'YAML-first (no code required)', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Python SDK', nika: false, langchain: true, crewai: true, autogen: true },
      { name: 'CLI native', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Zero boilerplate setup', nika: true, langchain: false, crewai: false, autogen: false },
    ],
  },
  {
    category: 'Multi-Agent',
    items: [
      { name: 'DAG execution engine', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Fan-out/Fan-in patterns', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'Scope isolation (4 presets)', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Deterministic orchestration', nika: true, langchain: false, crewai: false, autogen: false },
    ],
  },
  {
    category: 'LLM Providers',
    items: [
      { name: 'Claude (Anthropic)', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'GPT-4 (OpenAI)', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'Gemini (Google)', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'Local models (Ollama)', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'Switch provider in 1 line', nika: true, langchain: false, crewai: false, autogen: false },
    ],
  },
  {
    category: 'Developer Experience',
    items: [
      { name: 'Real-time TUI', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Git-friendly configs', nika: true, langchain: false, crewai: false, autogen: false },
      { name: 'Built-in observability', nika: true, langchain: true, crewai: false, autogen: false },
      { name: 'Structured outputs', nika: true, langchain: true, crewai: true, autogen: true },
    ],
  },
  {
    category: 'Production',
    items: [
      { name: 'MIT License', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'No vendor lock-in', nika: true, langchain: true, crewai: true, autogen: true },
      { name: 'CI/CD ready', nika: true, langchain: true, crewai: false, autogen: false },
      { name: 'Single binary (Rust)', nika: true, langchain: false, crewai: false, autogen: false },
    ],
  },
];

function getFeatureValue(item: Record<string, boolean | string>, tool: string): boolean {
  const key = tool.toLowerCase().replace(' ', '') as keyof typeof item;
  return item[key] as boolean;
}
</script>

<template>
  <section id="comparison" class="py-24 relative">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="section-header">
        <span class="badge badge-accent mb-4">
          <Icon name="heroicons:scale" class="w-4 h-4" />
          Comparison
        </span>
        <h2 class="section-title">
          Nika vs Popular Frameworks
        </h2>
        <p class="section-subtitle">
          See how Nika compares to LangChain, CrewAI, and AutoGen
        </p>
      </div>

      <!-- Comparison table -->
      <div class="overflow-x-auto scrollbar-thin rounded-xl border border-terminal-border">
        <table class="w-full border-collapse">
          <!-- Header -->
          <thead>
            <tr class="bg-terminal-surface">
              <th class="text-left p-4 text-terminal-muted font-medium text-sm">
                Features
              </th>
              <th
                v-for="tool in tools"
                :key="tool.name"
                class="p-4 text-center min-w-[120px]"
                :class="tool.highlight ? 'bg-space-950/50' : ''"
              >
                <div class="flex flex-col items-center gap-1">
                  <span
                    class="font-bold"
                    :class="tool.highlight ? 'text-space-400 text-lg' : 'text-white'"
                  >
                    {{ tool.name }}
                  </span>
                  <span
                    v-if="tool.highlight"
                    class="text-xs px-2 py-0.5 rounded-full bg-space-500/20 text-space-300"
                  >
                    YAML + CLI
                  </span>
                  <span
                    v-else
                    class="text-xs text-terminal-muted"
                  >
                    Python SDK
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            <template v-for="category in features" :key="category.category">
              <!-- Category header -->
              <tr>
                <td
                  :colspan="tools.length + 1"
                  class="px-4 py-3 text-xs font-semibold text-terminal-muted uppercase tracking-wider bg-terminal-surface/50 border-t border-terminal-border"
                >
                  {{ category.category }}
                </td>
              </tr>

              <!-- Feature rows -->
              <tr
                v-for="item in category.items"
                :key="item.name"
                class="hover:bg-terminal-surface/30 transition-colors"
              >
                <td class="p-4 text-sm text-terminal-text border-b border-terminal-border/30">
                  {{ item.name }}
                </td>
                <td
                  v-for="tool in tools"
                  :key="`${item.name}-${tool.name}`"
                  class="p-4 text-center border-b border-terminal-border/30"
                  :class="tool.highlight ? 'bg-space-950/20' : ''"
                >
                  <div class="flex justify-center">
                    <Icon
                      v-if="getFeatureValue(item, tool.name)"
                      name="heroicons:check-circle-solid"
                      class="w-5 h-5"
                      :class="tool.highlight ? 'text-terminal-green' : 'text-terminal-green/60'"
                    />
                    <Icon
                      v-else
                      name="heroicons:minus-circle"
                      class="w-5 h-5 text-terminal-muted/30"
                    />
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Key differentiators -->
      <div class="grid md:grid-cols-3 gap-6 mt-12">
        <div class="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-space-500/10 flex items-center justify-center">
              <Icon name="heroicons:document-text" class="w-5 h-5 text-space-400" />
            </div>
            <h3 class="font-semibold text-white">YAML vs Python</h3>
          </div>
          <p class="text-sm text-terminal-muted">
            No Python required. Define workflows in readable YAML that anyone on your team can understand and modify.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-space-500/10 flex items-center justify-center">
              <Icon name="heroicons:cpu-chip" class="w-5 h-5 text-space-400" />
            </div>
            <h3 class="font-semibold text-white">Deterministic DAG</h3>
          </div>
          <p class="text-sm text-terminal-muted">
            Unlike chat-based agents, Nika executes a deterministic DAG. Predictable, debuggable, reproducible.
          </p>
        </div>

        <div class="p-5 rounded-xl bg-terminal-surface border border-terminal-border">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-space-500/10 flex items-center justify-center">
              <Icon name="heroicons:command-line" class="w-5 h-5 text-space-400" />
            </div>
            <h3 class="font-semibold text-white">Single Binary</h3>
          </div>
          <p class="text-sm text-terminal-muted">
            Built in Rust. No Python environment, no dependencies. Just download and run <code class="text-space-300">nika run</code>.
          </p>
        </div>
      </div>

      <!-- Bottom CTA -->
      <div class="mt-12 text-center">
        <p class="text-terminal-muted mb-4">
          Ready to try the YAML-first approach?
        </p>
        <a href="#get-started" class="btn-primary">
          <Icon name="heroicons:rocket-launch-solid" class="w-5 h-5" />
          Get Started Free
        </a>
      </div>
    </div>
  </section>
</template>
