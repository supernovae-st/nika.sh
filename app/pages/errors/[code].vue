<script setup lang="ts">
import { computed } from 'vue';

interface NikaErrorEntry {
  code: string;
  title: string;
  summary: string;
  help: string;
  example?: string;
  docs?: string;
  related?: string[];
  category: string;
}

interface Catalog {
  version: number;
  errors: Record<string, NikaErrorEntry>;
}

const route = useRoute();
const rawCode = String(route.params.code ?? '').trim();

// Normalize: accept 001, nika-001, NIKA-001 → NIKA-001
const normalizedCode = computed(() => {
  const up = rawCode.toUpperCase();
  const m = up.match(/^(?:NIKA-)?(\d{1,4})$/);
  return m ? `NIKA-${m[1].padStart(3, '0')}` : up;
});

// Fetched from a static JSON, so this works on any static host (DO Spaces,
// Cloudflare Pages, S3, etc.) — no server runtime required.
const { data: catalog } = await useFetch<Catalog>('/errors/catalog.json', {
  key: 'errors-catalog',
  default: () => ({ version: 0, errors: {} }),
});

const entry = computed<NikaErrorEntry | undefined>(() => {
  return catalog.value?.errors?.[normalizedCode.value];
});

useSeoMeta({
  title: () =>
    entry.value
      ? `${entry.value.code}: ${entry.value.title} | Nika Error Reference`
      : `Unknown error ${normalizedCode.value} | Nika`,
  description: () => entry.value?.summary ?? 'Nika error code reference.',
  ogTitle: () =>
    entry.value ? `${entry.value.code}: ${entry.value.title}` : 'Nika error',
  ogDescription: () => entry.value?.summary ?? 'Nika error code reference.',
  robots: () => (entry.value ? 'index, follow' : 'noindex'),
});
</script>

<template>
  <article class="min-h-screen pt-24 pb-20">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumb -->
      <nav class="mb-8" aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-terminal-muted">
          <li><NuxtLink to="/" class="hover:text-white">Home</NuxtLink></li>
          <li><Icon name="mdi:chevron-right" class="w-4 h-4" /></li>
          <li><span class="text-terminal-muted">Errors</span></li>
          <li><Icon name="mdi:chevron-right" class="w-4 h-4" /></li>
          <li class="text-amber-400">{{ normalizedCode }}</li>
        </ol>
      </nav>

      <template v-if="entry">
        <header class="mb-10">
          <div class="flex items-center gap-3 mb-3">
            <span class="font-mono text-sm px-2 py-1 rounded bg-terminal-surface border border-terminal-border text-amber-400">
              {{ entry.code }}
            </span>
            <span class="text-xs uppercase tracking-wide text-terminal-muted">
              {{ entry.category }}
            </span>
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            {{ entry.title }}
          </h1>
          <p class="text-lg text-terminal-muted leading-relaxed">
            {{ entry.summary }}
          </p>
        </header>

        <section class="mb-10">
          <h2 class="text-xl font-semibold text-white mb-3">How to fix it</h2>
          <p class="text-terminal-muted leading-relaxed">{{ entry.help }}</p>
        </section>

        <section v-if="entry.example" class="mb-10">
          <h2 class="text-xl font-semibold text-white mb-3">Example</h2>
          <pre class="bg-terminal-surface border border-terminal-border rounded-lg p-4 overflow-x-auto text-sm font-mono text-terminal-muted"><code>{{ entry.example }}</code></pre>
        </section>

        <section v-if="entry.related && entry.related.length" class="mb-10">
          <h2 class="text-xl font-semibold text-white mb-3">Related errors</h2>
          <ul class="flex flex-wrap gap-2">
            <li v-for="rel in entry.related" :key="rel">
              <NuxtLink
                :to="`/errors/${rel}`"
                class="font-mono text-sm px-2 py-1 rounded bg-terminal-surface border border-terminal-border text-terminal-muted hover:text-white transition-colors"
              >
                {{ rel }}
              </NuxtLink>
            </li>
          </ul>
        </section>

        <section v-if="entry.docs" class="mb-10">
          <a
            :href="entry.docs"
            class="inline-flex items-center gap-2 text-space-400 hover:text-white transition-colors"
          >
            <Icon name="mdi:book-open-page-variant" class="w-5 h-5" />
            Read the full documentation
          </a>
        </section>
      </template>

      <template v-else>
        <header class="mb-8">
          <h1 class="text-3xl sm:text-4xl font-bold text-white mb-4">
            Unknown error code
          </h1>
          <p class="text-lg text-terminal-muted leading-relaxed">
            <span class="font-mono text-amber-400">{{ normalizedCode }}</span>
            is not in the Nika error catalog yet.
          </p>
          <p class="mt-4 text-sm text-terminal-muted">
            If your CLI reported this code, please
            <a
              href="https://github.com/SuperNovae-studio/nika/issues/new"
              class="text-space-400 hover:text-white"
            >open an issue</a>
            with the full workflow and command so we can document it.
          </p>
          <p class="mt-6">
            <NuxtLink to="/" class="text-space-400 hover:text-white">
              ← Back to home
            </NuxtLink>
          </p>
        </header>
      </template>
    </div>
  </article>
</template>
