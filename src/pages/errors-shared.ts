/* ─── errors-shared · the register's small shared vocabulary ──────────────────
   Split from Errors.tsx when /errors/:code graduated to its own room
   (ErrorPage) — the gloss and the namespace splitter serve both pages,
   and a page module must export only its Component (react-refresh law). */

export const CATEGORY_GLOSS: Record<string, string> = {
  parse_error: 'the YAML itself is malformed',
  validation_error: 'well-formed input, spec-rule violation',
  variable_error: 'reference resolution / substitution',
  budget_error: 'an agent loop budget exhausted',
  provider_error: 'the model provider failed',
  network_error: 'network I/O failed',
  tool_error: 'a tool invocation failed',
  security_error: 'a security policy refused the effect',
  timeout_error: 'a task or step timed out',
  cancelled: 'cancelled before completion',
  internal_error: 'an engine bug; report it',
}

export function nsOf(code: string): string {
  return code.split('-').slice(0, 2).join('-')
}
