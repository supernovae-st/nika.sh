/* ─── lessons-access · the ONLY door to the teaching path's YAML ─────────────
   (the anatomy-access recipe) lessons-yaml.generated.ts is ~44KB of workflow
   text — thirteen whole files. It reaches the client only as an async chunk:
   SSG reads it through the SSR-only await so every room prerenders with its
   file in the HTML, and a SPA hop pulls the chunk once.

   The bundle-safety gate lives in lessons.test.ts: no static import of
   lessons-yaml outside this module. */

let SSR_YAML: Record<string, string> | null = null
if (import.meta.env.SSR) {
  const m = await import('../content/lessons-yaml.generated')
  SSR_YAML = m.LESSON_YAML
}

/** the whole path's YAML at SSG time (null on the client · ride the island) */
export const ssrLessonYaml = (): Record<string, string> | null => SSR_YAML

/** one lesson's file on the client · the async chunk, once */
export const loadLessonYaml = async (): Promise<Record<string, string>> =>
  (await import('../content/lessons-yaml.generated')).LESSON_YAML
