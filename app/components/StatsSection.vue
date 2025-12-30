<script setup lang="ts">
import { ref, onMounted } from 'vue';

const stats = [
  {
    value: 5,
    suffix: '',
    label: 'Semantic Verbs',
    description: 'agent, exec, fetch, invoke, infer',
    icon: 'mdi:code-braces',
    color: 'space',
  },
  {
    value: 4,
    suffix: '',
    label: 'Scope Presets',
    description: 'minimal, default, debug, full',
    icon: 'mdi:shield-lock',
    color: 'amber',
  },
  {
    value: 7,
    suffix: '',
    label: 'Asset Folders',
    description: 'skills, agents, prompts, schemas...',
    icon: 'mdi:folder-multiple',
    color: 'cyan',
  },
  {
    value: 100,
    suffix: '%',
    label: 'Open Source',
    description: 'MIT licensed, forever free',
    icon: 'mdi:open-source-initiative',
    color: 'green',
  },
];

// Animated counter
const displayValues = ref(stats.map(() => 0));

onMounted(() => {
  stats.forEach((stat, index) => {
    const duration = 2000;
    const steps = 60;
    const increment = stat.value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        displayValues.value[index] = stat.value;
        clearInterval(timer);
      } else {
        displayValues.value[index] = Math.floor(current);
      }
    }, duration / steps);
  });
});

const colorClasses = {
  space: {
    bg: 'bg-space-500/10',
    border: 'border-space-500/30',
    text: 'text-space-400',
    icon: 'text-space-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: 'text-amber-400',
  },
  cyan: {
    bg: 'bg-terminal-cyan/10',
    border: 'border-terminal-cyan/30',
    text: 'text-terminal-cyan',
    icon: 'text-terminal-cyan',
  },
  green: {
    bg: 'bg-terminal-green/10',
    border: 'border-terminal-green/30',
    text: 'text-terminal-green',
    icon: 'text-terminal-green',
  },
};
</script>

<template>
  <section class="py-16 relative bg-terminal-surface/30 border-y border-terminal-border">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <div
          v-for="(stat, index) in stats"
          :key="stat.label"
          class="relative p-6 rounded-xl border transition-all duration-300 hover:scale-105 group"
          :class="[colorClasses[stat.color as keyof typeof colorClasses].bg, colorClasses[stat.color as keyof typeof colorClasses].border]"
        >
          <!-- Icon -->
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
            :class="colorClasses[stat.color as keyof typeof colorClasses].bg"
          >
            <Icon
              :name="stat.icon"
              class="w-6 h-6"
              :class="colorClasses[stat.color as keyof typeof colorClasses].icon"
            />
          </div>

          <!-- Value -->
          <div class="flex items-baseline gap-1 mb-2">
            <span
              class="text-4xl font-bold tabular-nums"
              :class="colorClasses[stat.color as keyof typeof colorClasses].text"
            >
              {{ displayValues[index] }}
            </span>
            <span
              v-if="stat.suffix"
              class="text-2xl font-bold"
              :class="colorClasses[stat.color as keyof typeof colorClasses].text"
            >
              {{ stat.suffix }}
            </span>
          </div>

          <!-- Label -->
          <h3 class="text-white font-semibold mb-1">{{ stat.label }}</h3>
          <p class="text-terminal-muted text-sm">{{ stat.description }}</p>

          <!-- Hover glow -->
          <div
            class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            :class="`bg-gradient-to-br from-${stat.color === 'space' ? 'space-500' : stat.color === 'amber' ? 'amber-500' : stat.color === 'cyan' ? 'terminal-cyan' : 'terminal-green'}/5 to-transparent`"
          />
        </div>
      </div>
    </div>
  </section>
</template>
