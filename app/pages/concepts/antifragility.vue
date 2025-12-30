<script setup lang="ts">
useSeoMeta({
  title: 'Antifragile AI Workflows: Systems That Thrive on Chaos | Nika Research',
  description: 'Build AI workflows that get stronger from failures. Inspired by Nassim Taleb\'s Antifragile principles: optionality, controlled stress, and strategic redundancy for bulletproof multi-agent orchestration.',
  ogTitle: 'Antifragile AI Workflows | Nika',
  ogDescription: 'AI systems that grow stronger from chaos. Taleb-inspired resilience for production workflows.',
  keywords: 'antifragile AI systems, resilient AI workflows, chaos engineering LLM, self-healing AI, AI failure recovery patterns, Nassim Taleb AI, fault-tolerant multi-agent',
});

const principles = [
  {
    title: 'Embrace Optionality',
    description: 'Multiple providers, multiple models, multiple paths. When one fails, others are ready.',
    icon: 'mdi:source-branch',
  },
  {
    title: 'Small Failures, Big Learning',
    description: 'Expose the system to small, contained failures to build resilience against large ones.',
    icon: 'mdi:school',
  },
  {
    title: 'Redundancy Without Bloat',
    description: 'Strategic redundancy in critical paths, not everywhere. Cost-effective resilience.',
    icon: 'mdi:shield-check',
  },
  {
    title: 'Skin in the Game',
    description: 'Agents that propose actions should face consequences of their failures (budget penalties, scope reduction).',
    icon: 'mdi:account-check',
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
          <li class="text-amber-400">Antifragility</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
            <Icon name="mdi:lightning-bolt" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge-amber">Exploration Phase</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Antifragile Workflows</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          What if AI workflows could get <em>stronger</em> from failures, not just survive them?
        </p>
      </header>

      <!-- Content -->
      <div class="prose prose-invert max-w-none">
        <!-- Quote -->
        <blockquote class="border-l-4 border-amber-500 pl-6 my-8 italic text-terminal-muted">
          "Some things benefit from shocks; they thrive and grow when exposed to volatility, randomness,
          disorder, and stressors."
          <footer class="text-sm mt-2 not-italic text-terminal-muted">
            — Nassim Nicholas Taleb, <cite>Antifragile</cite>
          </footer>
        </blockquote>

        <!-- The Idea -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:lightbulb" class="w-6 h-6 text-amber-400" />
            The Core Idea
          </h2>

          <p class="text-terminal-muted mb-4">
            Most AI workflow systems are designed to be <strong class="text-white">robust</strong> — they try to
            resist failure and maintain stability. But robustness has limits. A robust system can only handle
            failures up to its design threshold.
          </p>

          <p class="text-terminal-muted mb-6">
            <strong class="text-white">Antifragile</strong> systems go beyond robustness. They actually improve
            when subjected to stressors. Every failure teaches the system something, making it better prepared
            for the next challenge.
          </p>

          <div class="terminal-block mb-6">
            <pre class="text-sm"><code># The Antifragility Spectrum

Fragile    → Breaks under stress
Robust     → Resists stress (to a point)
Antifragile → Gains from stress

Current AI Workflows: Mostly Fragile
Our Goal: Move toward Antifragile</code></pre>
          </div>
        </section>

        <!-- Principles -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:puzzle" class="w-6 h-6 text-amber-400" />
            Principles We're Exploring
          </h2>

          <div class="grid sm:grid-cols-2 gap-4 mb-6">
            <div
              v-for="principle in principles"
              :key="principle.title"
              class="p-4 bg-terminal-surface rounded-lg border border-terminal-border"
            >
              <div class="flex items-center gap-3 mb-2">
                <Icon :name="principle.icon" class="w-5 h-5 text-amber-400" />
                <h3 class="font-semibold text-white">{{ principle.title }}</h3>
              </div>
              <p class="text-terminal-muted text-sm">{{ principle.description }}</p>
            </div>
          </div>
        </section>

        <!-- What This Looks Like -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:code-braces" class="w-6 h-6 text-amber-400" />
            What This Might Look Like in Practice
          </h2>

          <div class="bg-terminal-surface p-6 rounded-lg border border-terminal-border mb-6">
            <p class="text-sm text-terminal-muted mb-4"># Hypothetical antifragile workflow behavior:</p>
            <div class="space-y-3 font-mono text-sm">
              <div class="flex items-start gap-2">
                <span class="text-amber-400">1.</span>
                <span class="text-terminal-text">Agent A fails with Provider X → System records failure pattern</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-amber-400">2.</span>
                <span class="text-terminal-text">Next run → System preemptively switches to Provider Y for similar tasks</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-amber-400">3.</span>
                <span class="text-terminal-text">After N successes → System occasionally tests Provider X again (controlled exposure)</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-amber-400">4.</span>
                <span class="text-terminal-text">Provider X improved? → Gradually reintegrate. Still failing? → Increase avoidance.</span>
              </div>
            </div>
          </div>

          <p class="text-terminal-muted">
            This is fundamentally different from a simple retry-with-fallback mechanism. The system is
            <em>learning</em> and <em>adapting</em> based on its experience with failures.
          </p>
        </section>

        <!-- Honest Assessment -->
        <section class="mb-12">
          <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Icon name="mdi:scale-balance" class="w-6 h-6 text-terminal-cyan" />
            Honest Assessment: This Is Hard
          </h2>

          <div class="bg-terminal-cyan/10 border border-terminal-cyan/20 rounded-lg p-6">
            <p class="text-terminal-text mb-4">
              We're not claiming to have solved this. True antifragility in AI systems is an open research problem.
              Here's where we are:
            </p>

            <ul class="space-y-2 text-terminal-muted">
              <li class="flex items-start gap-2">
                <Icon name="mdi:check" class="w-4 h-4 mt-1 text-terminal-green flex-shrink-0" />
                <span><strong class="text-white">Multi-provider support</strong> — Optionality is built in</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:check" class="w-4 h-4 mt-1 text-terminal-green flex-shrink-0" />
                <span><strong class="text-white">Scope isolation</strong> — Failures are contained</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:dots-horizontal" class="w-4 h-4 mt-1 text-amber-400 flex-shrink-0" />
                <span><strong class="text-white">Learning from failures</strong> — In design phase</span>
              </li>
              <li class="flex items-start gap-2">
                <Icon name="mdi:dots-horizontal" class="w-4 h-4 mt-1 text-amber-400 flex-shrink-0" />
                <span><strong class="text-white">Controlled stress exposure</strong> — Researching approaches</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- CTA -->
        <section class="border-t border-terminal-border pt-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p class="text-white font-semibold">Interested in resilient AI systems?</p>
              <p class="text-terminal-muted text-sm">We'd love to hear your ideas and experiences.</p>
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
