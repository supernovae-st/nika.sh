<script setup lang="ts">
useSeoMeta({
  title: 'Epistemic Awareness: AI That Knows What It Doesn\'t Know | Nika Research',
  description: 'Discover how Nika detects AI hallucinations in real-time using runtime epistemics. Collapse risk scoring, uncertainty quantification, and automatic mitigation policies for production-grade AI reliability.',
  ogTitle: 'Epistemic Awareness in AI Workflows | Nika',
  ogDescription: 'Making AI systems aware of their own knowledge boundaries. Real-time hallucination detection for production workflows.',
  keywords: 'epistemic awareness AI, hallucination detection LLM, AI uncertainty quantification, LLM reliability engineering, runtime AI monitoring, collapse risk AI, AI safety research',
});

const signals = [
  { name: 'Retries', description: 'Number of retry attempts for failed operations', type: 'health' },
  { name: 'Tool Errors', description: 'Errors from tool invocations', type: 'health' },
  { name: 'Timeouts', description: 'Operations exceeding expected duration', type: 'health' },
  { name: 'Stalls', description: 'Periods of no progress or activity', type: 'health' },
  { name: 'Schema Failures', description: 'Output not matching expected schema', type: 'quality' },
  { name: 'Parse Failures', description: 'Unable to parse structured output', type: 'quality' },
  { name: 'Repairs Needed', description: 'Number of output corrections', type: 'quality' },
  { name: 'Evidence Coverage', description: 'Ratio of claims with supporting evidence', type: 'evidence' },
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
          <li class="text-space-400">Epistemic Awareness</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-space-600 to-space-800 flex items-center justify-center">
            <Icon name="mdi:brain" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge">Active Research</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Epistemic Awareness</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          Teaching AI systems to know what they don't know — and to tell us about it.
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- The Problem -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:alert-circle" class="w-6 h-6 text-amber-400" />
            The Problem We're Solving
          </h2>

          <div class="bg-terminal-surface p-6 rounded-lg border border-terminal-border mb-6">
            <p class="text-terminal-text leading-relaxed">
              Large Language Models hallucinate. They make confident-sounding claims about things that aren't true.
              In a simple chatbot, this is annoying. In an <strong class="text-white">agentic workflow</strong>
              that's making decisions, writing code, or calling APIs, it can be dangerous.
            </p>
          </div>

          <p class="text-terminal-muted mb-4">
            Current approaches to this problem mostly focus on the model itself — fine-tuning, RLHF, or prompting
            techniques. But we believe there's a complementary approach that's been underexplored:
            <strong class="text-white">runtime observation</strong>.
          </p>
        </section>

        <!-- Our Approach -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:lightbulb" class="w-6 h-6 text-amber-400" />
            Our Approach: Runtime Epistemics
          </h2>

          <p class="text-terminal-muted mb-6">
            Instead of asking the model "are you sure?", we observe what's happening during execution and
            compute <strong class="text-white">objective signals</strong> about the system's epistemic state.
          </p>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code># Philosophy (from our internal docs)
EpistemicAwareness = SHAKA's sensing layer (NOT standalone)

Key Insight:
- We DON'T ask the LLM to self-evaluate (unreliable)
- We DO observe runtime behavior (objective)
- We compute collapse risk from signals (deterministic)</code></pre>
          </div>

          <h3 class="text-xl font-semibold text-white mb-4">Runtime Signals We Track</h3>

          <div class="grid gap-3 mb-6">
            <div
              v-for="signal in signals"
              :key="signal.name"
              class="flex items-center gap-4 p-3 bg-terminal-surface/50 rounded-lg border border-terminal-border"
            >
              <span
                class="px-2 py-0.5 text-xs rounded"
                :class="{
                  'bg-space-500/20 text-space-300': signal.type === 'health',
                  'bg-amber-500/20 text-amber-300': signal.type === 'quality',
                  'bg-terminal-green/20 text-terminal-green': signal.type === 'evidence',
                }"
              >
                {{ signal.type }}
              </span>
              <span class="font-mono text-white">{{ signal.name }}</span>
              <span class="text-terminal-muted text-sm">{{ signal.description }}</span>
            </div>
          </div>
        </section>

        <!-- Collapse Risk -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:gauge" class="w-6 h-6 text-amber-400" />
            Collapse Risk Scoring
          </h2>

          <p class="text-terminal-muted mb-6">
            These signals feed into a <strong class="text-white">deterministic scoring system</strong> that
            computes a "collapse risk" — the probability that the current execution is heading toward failure.
          </p>

          <div class="bg-terminal-surface p-6 rounded-lg border border-terminal-border mb-6">
            <div class="font-mono text-sm">
              <div class="text-terminal-muted mb-2"># Collapse Risk Levels (ScoreBp 0-10000)</div>
              <div class="grid gap-2">
                <div class="flex items-center gap-4">
                  <span class="w-24 text-terminal-green">Low (0-2500)</span>
                  <div class="flex-1 h-2 bg-terminal-border rounded">
                    <div class="w-1/4 h-full bg-terminal-green rounded" />
                  </div>
                  <span class="text-terminal-muted text-xs">Normal operation</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-24 text-amber-400">Medium</span>
                  <div class="flex-1 h-2 bg-terminal-border rounded">
                    <div class="w-1/2 h-full bg-amber-400 rounded" />
                  </div>
                  <span class="text-terminal-muted text-xs">Increased monitoring</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-24 text-orange-400">High</span>
                  <div class="flex-1 h-2 bg-terminal-border rounded">
                    <div class="w-3/4 h-full bg-orange-400 rounded" />
                  </div>
                  <span class="text-terminal-muted text-xs">Mitigation activated</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="w-24 text-red-400">Critical</span>
                  <div class="flex-1 h-2 bg-terminal-border rounded">
                    <div class="w-full h-full bg-red-400 rounded" />
                  </div>
                  <span class="text-terminal-muted text-xs">Early stop possible</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Open Questions -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:help-circle" class="w-6 h-6 text-terminal-cyan" />
            Open Questions (We Don't Have All the Answers)
          </h2>

          <div class="bg-terminal-cyan/10 border border-terminal-cyan/20 rounded-lg p-6">
            <ul class="space-y-3 text-terminal-text">
              <li class="flex items-start gap-2">
                <Icon name="mdi:circle-outline" class="w-4 h-4 mt-1 text-terminal-cyan flex-shrink-0" />
                <span>How do we calibrate signal weights across different task types?</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:circle-outline" class="w-4 h-4 mt-1 text-terminal-cyan flex-shrink-0" />
                <span>Can we train a meta-model to predict collapse risk more accurately?</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:circle-outline" class="w-4 h-4 mt-1 text-terminal-cyan flex-shrink-0" />
                <span>What's the right balance between false positives and missed failures?</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:circle-outline" class="w-4 h-4 mt-1 text-terminal-cyan flex-shrink-0" />
                <span>How do epistemic signals differ across model providers (Claude vs GPT vs Gemini)?</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">Want to explore this with us?</p>
              <p class="text-terminal-muted text-sm">We're looking for collaborators and early testers.</p>
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
