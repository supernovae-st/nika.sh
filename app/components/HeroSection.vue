<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Terminal animation state
const showTerminal = ref(false);
const terminalLines = ref<string[]>([]);

const fullTerminalOutput = [
  '$ nika run workflow.nika.yaml',
  '',
  'Running workflow: code-review',
  '',
  '  analyze  [minimal]  .......... done',
  '  review   [default]  .......... done',
  '  report   [minimal]  .......... done',
  '',
  'Workflow completed in 12.3s',
  'Output: ./reports/review.md',
];

onMounted(() => {
  setTimeout(() => {
    showTerminal.value = true;
    let lineIndex = 0;

    const addLine = () => {
      if (lineIndex < fullTerminalOutput.length) {
        terminalLines.value.push(fullTerminalOutput[lineIndex]);
        lineIndex++;
        setTimeout(addLine, lineIndex === 1 ? 50 : 150);
      }
    };

    setTimeout(addLine, 500);
  }, 300);
});
</script>

<template>
  <section class="relative min-h-screen flex flex-col justify-center pt-20 pb-16 overflow-hidden">
    <!-- Background gradient -->
    <div class="absolute inset-0 bg-terminal-bg" />
    <div class="absolute inset-0 bg-hero-gradient" />

    <!-- Subtle grid -->
    <div class="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <!-- Centered content -->
      <div class="text-center space-y-8">
        <!-- Eyebrow badge -->
        <div class="animate-fade-in">
          <span class="badge badge-accent">
            <span class="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            Open Beta - Ship AI Workflows Today
          </span>
        </div>

        <!-- Main headline -->
        <div class="space-y-4 animate-slide-up">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            <span class="text-white">The Agentic CLI for</span>
            <br />
            <span class="gradient-text">AI Workflow Automation</span>
          </h1>

          <p class="text-lg sm:text-xl text-terminal-muted max-w-2xl mx-auto">
            Turn YAML into autonomous AI workflows. Multi-agent orchestration with
            <span class="text-white">Claude, GPT-4, Gemini, or Ollama</span>.
            Zero boilerplate. Production-ready.
          </p>
        </div>

        <!-- CTA buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-100">
          <a href="#get-started" class="btn-primary">
            <Icon name="heroicons:rocket-launch-solid" class="w-5 h-5" />
            Get Started Free
          </a>
          <a
            href="https://github.com/SuperNovae-studio/nika"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary"
          >
            <Icon name="mdi:github" class="w-5 h-5" />
            View on GitHub
          </a>
        </div>

        <!-- Trust signals -->
        <div class="flex items-center justify-center gap-6 text-sm text-terminal-muted animate-fade-in delay-200">
          <div class="flex items-center gap-2">
            <Icon name="heroicons:check-badge-solid" class="w-5 h-5 text-terminal-green" />
            <span>MIT Licensed</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="mdi:language-rust" class="w-5 h-5 text-accent-400" />
            <span>Built in Rust</span>
          </div>
          <div class="flex items-center gap-2">
            <Icon name="heroicons:bolt-solid" class="w-5 h-5 text-space-400" />
            <span>10x Faster</span>
          </div>
        </div>
      </div>

      <!-- Terminal preview - centered below -->
      <div class="mt-16 animate-scale-in delay-300">
        <div class="max-w-3xl mx-auto">
          <!-- Terminal window -->
          <div
            class="terminal-block glow-violet overflow-hidden transition-all duration-500"
            :class="{ 'opacity-0 translate-y-4': !showTerminal, 'opacity-100 translate-y-0': showTerminal }"
          >
            <!-- Terminal header -->
            <div class="flex items-center gap-3 pb-4 border-b border-terminal-border mb-4">
              <div class="flex gap-2">
                <div class="w-3 h-3 rounded-full bg-terminal-red/80" />
                <div class="w-3 h-3 rounded-full bg-accent-400/80" />
                <div class="w-3 h-3 rounded-full bg-terminal-green/80" />
              </div>
              <span class="text-terminal-muted text-sm font-mono">Terminal</span>
              <div class="ml-auto flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
                <span class="text-terminal-muted text-xs">Live</span>
              </div>
            </div>

            <!-- Terminal content -->
            <div class="font-mono text-sm space-y-1 min-h-[240px]">
              <div
                v-for="(line, index) in terminalLines"
                :key="index"
                class="leading-relaxed"
                :class="{
                  'text-terminal-green': line.startsWith('$'),
                  'text-white font-medium': line.startsWith('Running') || line.startsWith('Workflow'),
                  'text-terminal-cyan': line.includes('done'),
                  'text-terminal-muted': line.includes('['),
                  'text-terminal-text': !line.startsWith('$') && !line.includes('done') && !line.includes('[') && line.trim(),
                }"
              >
                {{ line || '&nbsp;' }}
              </div>
            </div>
          </div>

          <!-- Floating stats below terminal -->
          <div class="grid grid-cols-3 gap-4 mt-6">
            <div class="text-center p-4 rounded-lg bg-terminal-surface/50 border border-terminal-border">
              <div class="text-2xl font-bold text-white">5</div>
              <div class="text-xs text-terminal-muted">Semantic Verbs</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-terminal-surface/50 border border-terminal-border">
              <div class="text-2xl font-bold text-white">4</div>
              <div class="text-xs text-terminal-muted">Scope Presets</div>
            </div>
            <div class="text-center p-4 rounded-lg bg-terminal-surface/50 border border-terminal-border">
              <div class="text-2xl font-bold text-white">Any</div>
              <div class="text-xs text-terminal-muted">LLM Provider</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <a href="#features" class="text-terminal-muted hover:text-white transition-colors">
        <Icon name="heroicons:chevron-double-down" class="w-6 h-6" />
      </a>
    </div>
  </section>
</template>
