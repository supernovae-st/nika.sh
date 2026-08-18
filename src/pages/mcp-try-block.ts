/* ─── the MCP try-it block · ONE builder, its own module ─────────────────────
   Lives outside the component file because react-refresh wants component
   files to export only components (the gate red of 2026-08-03). Rendered
   by CatalogMcpRoom and judged by src/test/mcp-try-block.test.ts (AJV
   against the pinned schema with a real ref — the oracle returned
   `✔ clean` on this exact shape 2026-08-03).
   invoke takes a MAPPING · the ref separator is `/` · the grant lives in
   permits.tools with the FULL ref. */
export function mcpTryBlock(id: string, slug: string): string {
  return `nika: wire-${slug}\ntasks:\n  work:\n    invoke:\n      tool: "mcp:${id}/<tool>"\npermits:\n  tools: ["mcp:${id}/<tool>"]`
}
