import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const entries = (await getCollection('changelog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'Nika Changelog',
    description: 'Weekly dev logs. What grew, what hurt, what we learned.',
    site: context.site!.toString(),
    items: entries.map((entry) => ({
      title: `Week ${entry.data.week} — ${entry.data.title}`,
      pubDate: entry.data.date,
      description: entry.data.summary,
      link: `/changelog/${entry.id}/`,
    })),
    customData: '<language>en</language>',
    stylesheet: undefined,
  });
}
