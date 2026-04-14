// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/seo',
    '@vueuse/nuxt',
    '@nuxt/fonts',
    '@nuxt/icon',
  ],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Nika - Agentic Workflow CLI for AI Automation',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  site: {
    url: 'https://nika.sh',
    name: 'Nika',
    description: 'The open-source agentic workflow CLI. Orchestrate AI agents with YAML. Multi-model, multi-provider automation for developers.',
    defaultLocale: 'en',
  },

  seo: {
    redirectToCanonicalSiteUrl: true,
  },

  ogImage: {
    enabled: true,
  },

  sitemap: {
    enabled: true,
  },

  robots: {
    enabled: true,
  },

  fonts: {
    families: [
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700, 800] },
    ],
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },

  routeRules: {
    '/**': { prerender: true },
    // Dynamic + binary-ish endpoints: render at runtime, never prerender.
    '/errors/**': { prerender: false, ssr: true },
    '/api/errors/**': { prerender: false },
    // Static-file assets in public/ are served by Nitro automatically;
    // we just make sure Nuxt never treats install.sh as an HTML route.
    '/install.sh': { prerender: false },
    '/schema/**': { prerender: false },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/concepts',
        // Original 7 concepts
        '/concepts/epistemic-awareness',
        '/concepts/antifragility',
        '/concepts/scope-isolation',
        '/concepts/shaka-system',
        '/concepts/dag-execution',
        '/concepts/context-engineering',
        '/concepts/multi-provider',
        // New 6 concepts from advanced research
        '/concepts/bounded-rationality',
        '/concepts/graceful-degradation',
        '/concepts/declarative-intent',
        '/concepts/chaos-engineering',
        '/concepts/self-healing',
        '/concepts/observability-driven',
        '/sitemap.xml',
        '/robots.txt',
      ],
    },
  },
});
