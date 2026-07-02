import { CANON } from '../canon.generated'
import { ENGINE_VERSION } from '../content'

/* ─── FAQ data · the single source of truth for the FAQ section + its JSON-LD ──
   v4.1 control narrative · the honest Q&A that disarms the real objections a sharp
   visitor has. Lives in its own module (not the component) so it can be the SSOT
   for BOTH the rendered <details> list (Faq.tsx) AND the FAQPage structured data
   (built in Home.tsx) — the structured data can never drift from the page.

   Honest by construction: no invented metrics; the maturity answer states
   the real-semver-toward-1.0 status + the dual license plainly. The provider/verb counts come from
   CANON (the spec SSOT projected from nika-spec canon.yaml) — never hand-typed.

   Plain-text answers (no JSX) so the same string serialises cleanly into the
   JSON-LD Answer.text. */

export interface FaqItem {
  q: string
  a: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'I already see the agent’s steps in Cursor or a README. Why Nika?',
    a: 'Seeing the steps is not the same as enforcing the procedure. A README is documentation; a Nika file is an executable contract — versionable, replayable, permission-bound, auditable, and portable off any platform. You do not just read what it intends to do; the runtime holds it to exactly that.',
  },
  {
    q: 'Isn’t this just YAML, or another workflow engine?',
    a: `The syntax is plain YAML, but the point is not the syntax — it is the reviewable, enforced plan. The ${CANON.verbs} verbs (infer · exec · invoke · agent) are native execution models, each one explicit and typed, with a permits: block the runtime enforces before anything runs. The file is the control surface, not the formatting.`,
  },
  {
    q: 'Why not LangGraph, n8n, or MCP?',
    a: 'They live at a different layer. Frameworks help you orchestrate and assistants help an agent act; MCP exposes tools to call. Nika is the contract-and-control layer underneath: it makes the plan reviewable and enforceable, and it runs their tools through invoke — allow-listed and traced. It complements them rather than replacing them.',
  },
  {
    q: 'Does my data leave my machine?',
    a: `Local-first and provider-agnostic. Run a fully local model and nothing leaves at all. Every plan declares its network egress in its permits: block, and it is default-deny — omit the hosts and the workflow physically cannot reach the network. The file states exactly what can leave, and the runtime enforces it. ${CANON.providersLocal} of the ${CANON.providers} providers are local.`,
  },
  {
    q: 'Is it production-ready? What’s the license?',
    a: `Honest answer: Nika is early — real semver toward a 1.0 launch, currently at ${ENGINE_VERSION}, shipping in the open. It is one Rust binary you can install and run today. The engine is AGPL-3.0-or-later; the spec is Apache-2.0. We would rather you trust the spec and the binary than a maturity claim we have not earned yet.`,
  },
]
