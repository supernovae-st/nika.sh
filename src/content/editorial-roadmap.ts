/**
 * Public editorial queue. These are promises, not fabricated publication
 * dates. A candidate moves from here into content/blog only after the daily
 * workflow produces evidence, the deterministic quality law passes and a
 * human approves the Markdown.
 */
export const EDITORIAL_QUEUE = [
  {
    slug: 'the-model-string-is-a-deployment-decision',
    tag: 'Sovereignty',
    date: 'next',
    title: 'The model string is a deployment decision',
    teaser:
      'One workflow can move between a local seat and a cloud provider without acquiring a second grammar. The useful comparison is authority, price evidence and operational ownership.',
  },
  {
    slug: 'one-mcp-server-one-permit-line',
    tag: 'Security',
    date: 'queued',
    title: 'One MCP server, one permit line',
    teaser:
      'Tool discovery is not authorization. A practical walk from an MCP catalog room to the exact tool and network boundary a workflow declares.',
  },
  {
    slug: 'energy-is-a-sourced-row',
    tag: 'Engine',
    date: 'queued',
    title: 'Energy is a sourced row, not a green badge',
    teaser:
      'What Nika can say when a measured Wh-per-token row exists, what it must say when the row is absent, and why “unknown” is a product feature.',
  },
  {
    slug: 'a-trace-is-not-an-attestation',
    tag: 'Security',
    date: 'queued',
    title: 'A trace is not an attestation',
    teaser:
      'A chain, a seal, an anchor and a replay are different proof levels. This field note shows what each one answers and where the claim must stop.',
  },
] as const
