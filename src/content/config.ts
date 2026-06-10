import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/changelog' }),
  schema: z.object({
    week: z.number().int().positive(),
    version: z.string().optional(),
    title: z.string(),
    organ: z.string().optional(),
    date: z.coerce.date(),
    sha: z.string().optional(),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    organ: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { changelog, blog };
