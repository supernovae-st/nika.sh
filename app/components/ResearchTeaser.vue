<script setup lang="ts">
const concepts = [
  {
    title: 'Epistemic Awareness',
    description: 'AI that knows what it doesn\'t know',
    icon: 'mdi:brain',
    color: 'space',
  },
  {
    title: 'Antifragility',
    description: 'Systems stronger from stress',
    icon: 'mdi:lightning-bolt',
    color: 'amber',
  },
  {
    title: 'Context Engineering',
    description: 'Token optimization research',
    icon: 'mdi:text-box-multiple',
    color: 'cyan',
  },
];
</script>

<template>
  <section class="py-20 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left: Content -->
        <div class="space-y-6">
          <span class="badge">
            <Icon name="mdi:flask" class="w-4 h-4" />
            Research & Development
          </span>

          <h2 class="text-3xl sm:text-4xl font-bold text-white">
            Not Just Another CLI.
            <span class="gradient-text">Real Research.</span>
          </h2>

          <p class="text-terminal-muted text-lg leading-relaxed">
            We're exploring new approaches to make AI workflows safer, more predictable,
            and genuinely useful. From epistemic awareness to antifragile systems —
            <strong class="text-white">we're building on science, not hype</strong>.
          </p>

          <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p class="text-amber-300 text-sm">
              <Icon name="mdi:information" class="w-4 h-4 inline mr-1" />
              <strong>Honest disclaimer:</strong> This is ongoing research. Not everything
              will make it to v1.0. We share openly to gather feedback and find collaborators.
            </p>
          </div>

          <NuxtLink to="/concepts" class="btn-primary inline-flex">
            <Icon name="mdi:book-open" class="w-5 h-5" />
            Explore Our Research
            <Icon name="mdi:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <!-- Right: Concept cards -->
        <div class="space-y-4">
          <NuxtLink
            v-for="concept in concepts"
            :key="concept.title"
            to="/concepts"
            class="block p-5 bg-terminal-surface/50 border border-terminal-border rounded-xl hover:border-space-500/30 transition-all duration-300 group"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                :class="{
                  'bg-space-500/20': concept.color === 'space',
                  'bg-amber-500/20': concept.color === 'amber',
                  'bg-terminal-cyan/20': concept.color === 'cyan',
                }"
              >
                <Icon
                  :name="concept.icon"
                  class="w-6 h-6"
                  :class="{
                    'text-space-400': concept.color === 'space',
                    'text-amber-400': concept.color === 'amber',
                    'text-terminal-cyan': concept.color === 'cyan',
                  }"
                />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold text-white group-hover:text-space-400 transition-colors">
                  {{ concept.title }}
                </h3>
                <p class="text-terminal-muted text-sm">{{ concept.description }}</p>
              </div>
              <Icon
                name="mdi:chevron-right"
                class="w-5 h-5 text-terminal-muted opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </NuxtLink>

          <!-- More concepts indicator -->
          <div class="text-center pt-2">
            <NuxtLink to="/concepts" class="text-terminal-muted hover:text-white text-sm transition-colors">
              + 4 more concepts to explore
              <Icon name="mdi:arrow-right" class="w-4 h-4 inline" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
