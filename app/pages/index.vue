<script setup lang="ts">
// SEO Meta tags optimized for agentic workflow keywords
useSeoMeta({
  title: 'Nika - Ship AI Workflows 10x Faster | Open-Source Agentic CLI',
  description: 'The open-source agentic workflow CLI that turns YAML into autonomous AI agents. Zero boilerplate, any LLM (Claude, GPT-4, Gemini, Ollama). Production-ready multi-agent orchestration for developers who ship.',
  ogTitle: 'Nika - Ship AI Workflows 10x Faster',
  ogDescription: 'Turn YAML into autonomous AI agents. Zero boilerplate. Any LLM. Production-ready multi-agent orchestration.',
  ogImage: '/og-image.png',
  ogUrl: 'https://nika.sh',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Nika - Ship AI Workflows 10x Faster',
  twitterDescription: 'Open-source agentic CLI. YAML to AI workflows. Claude + GPT-4 + Gemini + Ollama. Zero lock-in.',
  keywords: 'agentic workflow CLI, AI automation tool, multi-agent orchestration, autonomous AI agents, yaml workflow automation, Claude GPT-4 Gemini Ollama, LLM orchestration, developer tools open source, AI workflow engine, multi-model AI pipeline',
  author: 'SuperNovae Studio',
  robots: 'index, follow',
});

// JSON-LD Structured Data for SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Nika',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'macOS, Linux, Windows',
        description: 'Open-source agentic workflow CLI for AI automation. Orchestrate multi-agent workflows with YAML.',
        url: 'https://nika.sh',
        author: {
          '@type': 'Organization',
          name: 'SuperNovae Studio',
          url: 'https://github.com/SuperNovae-studio',
        },
        license: 'https://opensource.org/licenses/MIT',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Multi-agent orchestration',
          'YAML-based workflow definition',
          'Multi-provider support (Claude, GPT-4, Gemini)',
          'DAG-based execution engine',
          'Scope isolation and context control',
          'Beautiful CLI with TUI',
        ],
        keywords: [
          'agentic workflow',
          'AI automation',
          'multi-agent orchestration',
          'CLI tool',
          'yaml workflow',
          'llm orchestration',
        ],
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is an agentic workflow?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'An agentic workflow is a system where AI agents autonomously execute tasks, make decisions, and collaborate to achieve complex goals. Unlike simple prompt-response patterns, agentic workflows involve planning, tool use, and multi-step reasoning.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which LLM providers does Nika support?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Nika supports multiple providers out of the box: Anthropic (Claude), OpenAI (GPT-4), Google (Gemini), and local models via Ollama. You can mix providers in a single workflow.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is Nika open source?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Nika is 100% open source under the MIT license. You can use it for personal projects, commercial applications, or contribute to its development on GitHub.',
            },
          },
        ],
      }),
    },
  ],
});
</script>

<template>
  <div>
    <HeroSection />
    <StatsSection />
    <FeaturesSection />
    <HowItWorksSection />
    <ComparisonSection />
    <UseCasesSection />
    <ResearchTeaser />
    <FAQSection />
    <CTASection />
  </div>
</template>
