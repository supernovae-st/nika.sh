<script setup lang="ts">
import { ref } from 'vue';

const faqs = [
  {
    question: 'What is an agentic workflow and why does it matter?',
    answer: 'An agentic workflow is a system where AI agents autonomously execute tasks, make decisions, and collaborate to achieve complex goals. Unlike simple prompt-response patterns, agentic workflows involve planning, tool use, and multi-step reasoning. This matters because it transforms AI from a chatbot into a reliable automation engine. Nika makes agentic workflows accessible through simple YAML definitions—no PhD required.',
  },
  {
    question: 'Which LLM providers and AI models does Nika support?',
    answer: 'Nika supports all major LLM providers: Anthropic (Claude Opus, Sonnet, Haiku), OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5), Google (Gemini Pro, Gemini Ultra), and local models via Ollama (Llama, Mistral, CodeLlama, and more). You can mix providers in a single workflow—use Claude for reasoning, GPT-4 for code generation, and a local model for sensitive data. One workflow definition, infinite provider combinations.',
  },
  {
    question: 'How does 3D scope isolation make AI workflows more secure?',
    answer: 'Nika\'s revolutionary 3D scope system controls what each agent can see across three dimensions: DAG position (where in the workflow), transcript history (conversation memory), and state exposure (variables and outputs). With 4 preset aliases—Minimal (completely isolated 200K context), Default (position-aware), Debug (read-only access), and Full (shared context)—you get enterprise-grade security. Agents only see what they need, reducing hallucination risks and preventing data leaks.',
  },
  {
    question: 'Is Nika open source? What license does it use?',
    answer: 'Yes! Nika is 100% open source under the MIT license—the most permissive license possible. Use it for personal projects, startups, or enterprise applications. Modify, distribute, and commercialize freely. We believe AI automation tools should be transparent, auditable, and community-driven. No usage fees, no API costs (beyond your LLM provider), no hidden catches.',
  },
  {
    question: 'How is Nika different from LangChain, CrewAI, or AutoGen?',
    answer: 'Nika takes a radically different approach: CLI-first, YAML-only, zero boilerplate. While LangChain requires Python SDKs and complex chains, and CrewAI needs role definitions in code, Nika lets you define entire AI pipelines in a single YAML file under 50 lines. No SDK dependencies, no learning curve. Plus, our DAG execution engine provides deterministic, parallel execution that frameworks built on Python can\'t match. Ship workflows in minutes, not days.',
  },
  {
    question: 'Can I automate code review with Nika?',
    answer: 'Absolutely. Nika excels at automated code review workflows. Define a multi-agent pipeline: one agent for security analysis, another for code style, a third for performance review. Use scope isolation to prevent agents from seeing each other\'s outputs until the final merge. Fan-out to run reviews in parallel, then fan-in to aggregate results. Teams report 10x faster PR reviews with more comprehensive coverage.',
  },
  {
    question: 'How do I integrate Nika with CI/CD pipelines like GitHub Actions?',
    answer: 'Nika is built for CI/CD. Run `nika run workflow.yaml` from any CI platform (GitHub Actions, GitLab CI, CircleCI, Jenkins). Get structured JSON outputs for automated processing. Use CI Guard mode for snapshot-based validation and regression testing. The CLI returns proper exit codes, making it trivial to fail builds on workflow errors. Perfect for automated testing, deployment gates, and quality checks.',
  },
  {
    question: 'What is the SHAKA System in Nika?',
    answer: 'SHAKA (Smart Hybrid Advisory Kernel Agent) is Nika\'s runtime sidecar that observes, analyzes, and proposes optimizations—without ever executing. "SHAKA proposes. NIKA disposes." It provides epistemic awareness (knowing what the AI doesn\'t know), cost optimization suggestions, and quality gates. SHAKA operates in 4 modes from observe-only to live-gated-aggressive. It\'s research-driven AI safety, built into the runtime.',
  },
  {
    question: 'Can I run Nika with local LLMs for privacy?',
    answer: 'Yes! Nika supports Ollama for running local models like Llama 2, Mistral, CodeLlama, and more. Keep sensitive data on your machines—no API calls to external providers. Perfect for enterprise deployments, regulated industries, or air-gapped environments. Mix local and cloud models in the same workflow: route sensitive tasks to local models, delegate complex reasoning to cloud APIs.',
  },
  {
    question: 'What programming languages does Nika support?',
    answer: 'Nika is language-agnostic because workflows are defined in YAML, not code. Your AI agents can work with any programming language, file format, or tool. Use the exec: verb to run shell commands in any language. Use invoke: to call functions from any codebase. The CLI itself is built in Rust for maximum performance, but your workflows can automate Python, TypeScript, Go, Java, or anything else.',
  },
  {
    question: 'How does Nika handle errors and failures in AI workflows?',
    answer: 'Nika\'s DAG execution engine provides robust error handling. Each task can define retry policies, timeout limits, and fallback behaviors. The SHAKA system detects potential failures before they cascade. Use scope isolation to contain errors—a failing agent doesn\'t corrupt the entire workflow. All executions are logged and replayable for debugging. Production-grade resilience, not just demo-ware.',
  },
  {
    question: 'When will Nika be released?',
    answer: 'Nika is currently in open beta, with the stable v1.0 release planned for early 2025. Join the waitlist to get early access, provide feedback, and shape the roadmap. We\'re building in public—follow our GitHub for real-time development updates. Early adopters get direct access to the team and influence on features.',
  },
];

const openIndex = ref<number | null>(null);

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}
</script>

<template>
  <section id="faq" class="py-20 relative bg-terminal-surface/30">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Section header -->
      <div class="text-center mb-16">
        <span class="badge mb-4">
          <Icon name="mdi:help-circle" class="w-4 h-4" />
          FAQ
        </span>
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-4">
          Frequently Asked <span class="gradient-text">Questions</span>
        </h2>
        <p class="text-terminal-muted text-lg">
          Everything developers ask about agentic workflows, AI automation, and Nika
        </p>
      </div>

      <!-- FAQ items -->
      <div class="space-y-4">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="border border-terminal-border rounded-lg overflow-hidden"
        >
          <button
            class="w-full px-6 py-4 text-left flex items-center justify-between bg-terminal-surface/50 hover:bg-terminal-surface transition-colors"
            @click="toggle(index)"
          >
            <span class="font-medium text-white">{{ faq.question }}</span>
            <Icon
              name="mdi:chevron-down"
              class="w-5 h-5 text-terminal-muted transition-transform duration-200"
              :class="{ 'rotate-180': openIndex === index }"
            />
          </button>

          <div
            v-show="openIndex === index"
            class="px-6 py-4 bg-terminal-bg/50"
          >
            <p class="text-terminal-muted leading-relaxed">
              {{ faq.answer }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
