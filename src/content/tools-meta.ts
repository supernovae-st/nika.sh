/* ─── the stdlib family glosses · one voice for register + rooms ──────────────
   Shared by /tools (the register) and /tools/:name (the detail rooms) — the
   category line was inlined in Tools.tsx until the rooms needed the same
   words (the CopyRow lesson: two copies drift silently). Editorial, not
   generated: the categories themselves are pinned by the drift gate
   (tools.test.ts asserts every tool sits in a rendered category). */

export const CATEGORY_GLOSS: Record<string, string> = {
  core: 'control flow and run-stream primitives',
  file: 'workspace files — read, write, search (permits.fs-gated)',
  data: 'pure JSON/data transforms — no I/O',
  network: 'network egress (permits.net-gated)',
  introspection: 'the workflow looking at itself',
  media: 'images, audio, charts — assets, not blobs',
}
