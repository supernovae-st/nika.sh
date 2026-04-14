// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://nika.sh',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.local(),
        name: 'Geist',
        cssVariable: '--font-sans',
        options: {
          variants: [
            {
              weight: '100 900',
              style: 'normal',
              src: ['./node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2'],
            },
          ],
        },
        fallbacks: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      {
        provider: fontProviders.local(),
        name: 'Geist Mono',
        cssVariable: '--font-mono',
        options: {
          variants: [
            {
              weight: '100 900',
              style: 'normal',
              src: ['./node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2'],
            },
          ],
        },
        fallbacks: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      {
        provider: fontProviders.google(),
        name: 'Instrument Serif',
        cssVariable: '--font-serif',
        styles: ['italic'],
        weights: ['400'],
        display: 'swap',
        subsets: ['latin'],
        fallbacks: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      {
        provider: fontProviders.local(),
        name: 'Departure Mono',
        cssVariable: '--font-display-mono',
        options: {
          variants: [
            {
              weight: '400',
              style: 'normal',
              src: ['./public/fonts/DepartureMono-Regular.woff2'],
            },
          ],
        },
        fallbacks: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
    ],
  },
  integrations: [
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: { theme: 'github-dark-dimmed', wrap: true },
    }),
    react(),
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
