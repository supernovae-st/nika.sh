<script setup lang="ts">
const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Use Cases', href: '/#use-cases' },
  { label: 'Research', href: '/concepts' },
  { label: 'FAQ', href: '/#faq' },
];
</script>

<template>
  <div class="relative min-h-screen bg-terminal-bg">
    <!-- Navigation -->
    <header class="fixed top-0 left-0 right-0 z-50 bg-terminal-bg/80 backdrop-blur-xl border-b border-terminal-border">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a href="/" class="flex items-center gap-3 group">
            <div class="w-8 h-8 rounded-lg bg-space-500 flex items-center justify-center">
              <span class="text-white font-bold text-lg">N</span>
            </div>
            <span class="font-bold text-xl text-white group-hover:text-space-400 transition-colors">nika</span>
            <span class="text-xs text-terminal-muted bg-terminal-surface px-2 py-0.5 rounded hidden sm:inline">v0.1.0</span>
          </a>

          <!-- Nav Links -->
          <div class="hidden md:flex items-center gap-8">
            <a
              v-for="link in navLinks"
              :key="link.href"
              :href="link.href"
              class="text-terminal-muted hover:text-white transition-colors text-sm font-medium"
            >
              {{ link.label }}
            </a>
          </div>

          <!-- CTA Buttons -->
          <div class="flex items-center gap-3">
            <a
              href="https://github.com/SuperNovae-studio/nika"
              target="_blank"
              rel="noopener noreferrer"
              class="text-terminal-muted hover:text-white transition-colors p-2"
              aria-label="View on GitHub"
            >
              <Icon name="mdi:github" class="w-5 h-5" />
            </a>
            <a href="#get-started" class="btn-primary text-sm py-2">
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main>
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t border-terminal-border py-12 mt-20 bg-terminal-surface/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 rounded bg-space-500 flex items-center justify-center">
              <span class="text-white font-bold text-xs">N</span>
            </div>
            <span class="text-terminal-muted text-sm">
              Built by
              <a href="https://github.com/SuperNovae-studio" class="text-white hover:text-space-400 transition-colors">
                SuperNovae Studio
              </a>
            </span>
          </div>

          <div class="flex items-center gap-6 text-terminal-muted text-sm">
            <NuxtLink to="/concepts" class="hover:text-white transition-colors">
              Research
            </NuxtLink>
            <a href="https://github.com/SuperNovae-studio/nika" class="hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://github.com/SuperNovae-studio/nika/blob/main/LICENSE" class="hover:text-white transition-colors">
              MIT License
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
