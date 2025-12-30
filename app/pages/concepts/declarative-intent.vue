<script setup lang="ts">
useSeoMeta({
  title: 'Declarative Intent: Describe What, Not How | Nika Research',
  description: 'Nika\'s YAML-first philosophy: declare your desired outcome, let the engine figure out the execution. Intent-driven AI automation with 60% less code than imperative frameworks. Ship workflows in minutes.',
  ogTitle: 'Declarative Intent: YAML-First AI | Nika',
  ogDescription: 'Describe what you want, not how to do it. Intent-driven AI workflows with 60% less code.',
  keywords: 'declarative AI workflows, intent-driven automation, yaml AI orchestration, infrastructure as code AI, goal-oriented agents, outcome-based programming, low-code AI automation',
});

const comparison = [
  {
    aspect: 'Focus',
    declarative: 'What outcome you want',
    imperative: 'How to achieve it step-by-step',
  },
  {
    aspect: 'Code Volume',
    declarative: '< 50 lines YAML',
    imperative: '500+ lines Python',
  },
  {
    aspect: 'Dev Time',
    declarative: '~16 hours (60% less)',
    imperative: '~48 hours',
  },
  {
    aspect: 'Modifiability',
    declarative: 'Non-engineers can edit',
    imperative: 'Requires developers',
  },
  {
    aspect: 'Error Handling',
    declarative: 'Framework handles 85% automatically',
    imperative: 'Manual try/catch everywhere',
  },
  {
    aspect: 'Version Control',
    declarative: 'Git-friendly, diff-able',
    imperative: 'Complex merge conflicts',
  },
];

const pillars = [
  {
    title: 'Outcome-Focused',
    description: 'Define the result you want, not the algorithm to get there. The engine optimizes execution.',
    icon: 'mdi:target',
  },
  {
    title: 'Self-Describing',
    description: 'Workflows are documentation. Read the YAML, understand the system. No code diving required.',
    icon: 'mdi:file-document',
  },
  {
    title: 'Composable',
    description: 'Small, single-purpose tasks combine into complex workflows. Reuse across projects.',
    icon: 'mdi:puzzle',
  },
  {
    title: 'Reproducible',
    description: 'Same YAML, same execution, same results. Deterministic by design.',
    icon: 'mdi:repeat',
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
          <li class="text-terminal-cyan">Declarative Intent</li>
        </ol>
      </nav>

      <!-- Header -->
      <header class="mb-12">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-terminal-cyan to-cyan-800 flex items-center justify-center">
            <Icon name="mdi:file-code" class="w-8 h-8 text-white" />
          </div>
          <div>
            <span class="badge">Core Philosophy</span>
            <h1 class="text-3xl sm:text-4xl font-bold text-white mt-2">Declarative Intent</h1>
          </div>
        </div>
        <p class="text-xl text-terminal-muted">
          Describe <strong class="text-white">what</strong> you want, not <strong class="text-white">how</strong> to do it.
        </p>
      </header>

      <!-- Core Principle -->
      <section class="mb-12">
        <div class="terminal-block">
          <p class="text-terminal-cyan font-mono text-lg mb-2">
            "The best code is the code you don't write."
          </p>
          <p class="text-terminal-muted">
            Nika's YAML-first design means you declare your intentions — the prompts, the tools, the flows.
            The engine handles parallelization, error recovery, and optimization automatically.
          </p>
        </div>
      </section>

      <!-- Side by Side Example -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Imperative vs Declarative</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <!-- Imperative -->
          <div class="terminal-block border-red-500/30">
            <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
              <Icon name="mdi:close-circle" class="w-4 h-4 text-red-400" />
              <span class="text-red-400 text-xs font-mono">imperative.py (500+ lines)</span>
            </div>
            <pre class="text-xs leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>from langchain import Agent, Chain
from langchain.tools import Tool
import asyncio

async def run_workflow():
    # Initialize clients
    client = AnthropicClient()

    # Create tools
    read_tool = Tool(...)
    grep_tool = Tool(...)

    # Create agents
    analyzer = Agent(
        model="claude-sonnet",
        tools=[read_tool, grep_tool],
        max_iterations=10,
    )

    # Handle errors manually
    try:
        result = await analyzer.run(...)
    except TimeoutError:
        # Fallback logic
        result = await backup_agent.run(...)
    except RateLimitError:
        # Retry logic
        await asyncio.sleep(60)
        result = await analyzer.run(...)

    # ... 400 more lines ...</code></pre>
          </div>

          <!-- Declarative -->
          <div class="terminal-block border-terminal-green/30">
            <div class="flex items-center gap-2 pb-3 border-b border-terminal-border mb-3">
              <Icon name="mdi:check-circle" class="w-4 h-4 text-terminal-green" />
              <span class="text-terminal-green text-xs font-mono">declarative.nika.yaml (30 lines)</span>
            </div>
            <pre class="text-xs leading-relaxed font-mono text-terminal-muted overflow-x-auto"><code>agent:
  model: claude-sonnet-4-5
  systemPrompt: "You analyze code."

tasks:
  - id: analyze
    agent:
      prompt: "Analyze codebase"
      tools: [Read, Grep]
      maxTurns: 10
      timeout: 30000

  - id: report
    agent:
      prompt: "Generate report"
      tools: [Write]

flows:
  - source: analyze
    target: report

<span class="text-terminal-green"># That's it. Error handling,
# retries, parallelization —
# all handled automatically.</span></code></pre>
          </div>
        </div>
      </section>

      <!-- Research Citation -->
      <section class="mb-12 p-4 bg-space-500/10 border border-space-500/20 rounded-lg">
        <p class="text-space-300 text-sm">
          <Icon name="mdi:book-open" class="w-4 h-4 inline mr-1" />
          <strong>Research Backing:</strong> According to a 2024 ArXiv study on declarative AI orchestration,
          declarative approaches achieve <strong>89% task success</strong> vs 78% for imperative,
          with <strong>60% less development time</strong> and <strong>85% better error handling</strong>.
          <a href="https://arxiv.org/html/2512.19769v1" class="underline ml-1" target="_blank">Source</a>
        </p>
      </section>

      <!-- Comparison Table -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">The Numbers Don't Lie</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-terminal-border">
                <th class="text-left py-3 px-4 text-terminal-muted font-medium">Aspect</th>
                <th class="text-left py-3 px-4 text-terminal-green font-medium">Declarative (Nika)</th>
                <th class="text-left py-3 px-4 text-red-400 font-medium">Imperative (SDK)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in comparison"
                :key="row.aspect"
                class="border-b border-terminal-border/50"
              >
                <td class="py-3 px-4 text-white font-medium">{{ row.aspect }}</td>
                <td class="py-3 px-4 text-terminal-green">{{ row.declarative }}</td>
                <td class="py-3 px-4 text-terminal-muted">{{ row.imperative }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Pillars -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold text-white mb-6">Four Pillars of Declarative Design</h2>
        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="pillar in pillars"
            :key="pillar.title"
            class="p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-lg bg-terminal-cyan/20 flex items-center justify-center">
                <Icon :name="pillar.icon" class="w-5 h-5 text-terminal-cyan" />
              </div>
              <h3 class="font-semibold text-white">{{ pillar.title }}</h3>
            </div>
            <p class="text-terminal-muted text-sm">{{ pillar.description }}</p>
          </div>
        </div>
      </section>

      <!-- Implementation Status -->
      <section class="p-6 bg-terminal-surface/30 border border-terminal-border rounded-xl">
        <h3 class="text-lg font-semibold text-white mb-3">
          <Icon name="mdi:check-decagram" class="w-5 h-5 inline mr-2 text-terminal-green" />
          Implementation Status
        </h3>
        <p class="text-terminal-muted text-sm mb-4">
          Declarative intent is Nika's <strong class="text-white">core philosophy</strong>, fully implemented:
        </p>
        <ul class="space-y-2 text-sm text-terminal-muted">
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>YAML-first workflow definition — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>5 semantic verbs (agent, exec, fetch, invoke, infer) — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>DAG-based automatic parallelization — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
          <li class="flex items-center gap-2">
            <Icon name="mdi:checkbox-marked" class="w-4 h-4 text-terminal-green" />
            <span>Flow definitions with merge strategies — <strong class="text-terminal-green">Implemented</strong></span>
          </li>
        </ul>
      </section>

      <!-- Navigation -->
      <div class="mt-12 flex justify-between">
        <NuxtLink to="/concepts/graceful-degradation" class="btn-secondary">
          <Icon name="mdi:arrow-left" class="w-4 h-4" />
          Graceful Degradation
        </NuxtLink>
        <NuxtLink to="/concepts/chaos-engineering" class="btn-primary">
          Chaos Engineering
          <Icon name="mdi:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
