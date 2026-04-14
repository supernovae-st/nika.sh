// server/api/errors/[code].ts
//
// Serves metadata for a NIKA-XXX error code. Users land here from CLI error
// messages that include a URL like https://nika.sh/errors/NIKA-001.
//
// Today the registry is hard-coded below. When nika-error (L0 crate) ships
// its generated JSON catalog, this handler should import that file instead
// of the literal map — the response shape stays the same.

import { defineEventHandler, createError, setResponseHeader, getRouterParam } from 'h3';

export interface NikaErrorEntry {
  code: string;
  title: string;
  summary: string;
  help: string;
  example?: string;
  docs?: string;
  related?: string[];
  category: 'workflow' | 'binding' | 'provider' | 'runtime' | 'security' | 'io' | 'unknown';
}

// -----------------------------------------------------------------------------
// Registry (stub — to be replaced by nika-error generated catalog)
// -----------------------------------------------------------------------------

const REGISTRY: Record<string, NikaErrorEntry> = {
  'NIKA-001': {
    code: 'NIKA-001',
    title: 'Workflow parse error',
    summary: 'The .nika.yaml file could not be parsed.',
    help: 'Check YAML indentation, quoting, and that the top-level `schema:` and `tasks:` keys are present.',
    example: 'schema: nika/workflow@0.12\ntasks:\n  - id: hello\n    verb: infer\n    with:\n      prompt: "Hi"',
    docs: 'https://nika.sh/docs/workflow-syntax',
    related: ['NIKA-002', 'NIKA-003'],
    category: 'workflow',
  },
  'NIKA-002': {
    code: 'NIKA-002',
    title: 'Schema version mismatch',
    summary: 'The `schema:` field does not match a version Nika understands.',
    help: 'Use `schema: nika/workflow@0.12` (current stable). Older versions can be migrated with `nika migrate`.',
    example: 'schema: nika/workflow@0.12',
    docs: 'https://nika.sh/docs/workflow-syntax#schema',
    related: ['NIKA-001'],
    category: 'workflow',
  },
  'NIKA-003': {
    code: 'NIKA-003',
    title: 'Duplicate task id',
    summary: 'Two tasks share the same `id`. Task ids must be unique within a workflow.',
    help: 'Rename one of the conflicting tasks. Task ids follow the identifier pattern `[a-zA-Z_][a-zA-Z0-9_-]*`.',
    docs: 'https://nika.sh/docs/workflow-syntax#tasks',
    related: ['NIKA-001'],
    category: 'workflow',
  },
  'NIKA-004': {
    code: 'NIKA-004',
    title: 'Unknown binding',
    summary: 'A template expression references a variable that does not exist in the current scope.',
    help: 'Check that the referenced task ran before this one (via `depends_on`) and that the field name matches its output schema.',
    example: '${tasks.greet.output}',
    docs: 'https://nika.sh/docs/bindings',
    related: ['NIKA-005'],
    category: 'binding',
  },
  'NIKA-005': {
    code: 'NIKA-005',
    title: 'Template evaluation failed',
    summary: 'A template expression could not be rendered (type mismatch, missing field, or bad filter).',
    help: 'Verify the type of the referenced value. Use `| default(...)` to provide a fallback for optional fields.',
    example: "${tasks.fetch.response.body | default('')}",
    docs: 'https://nika.sh/docs/bindings#filters',
    related: ['NIKA-004'],
    category: 'binding',
  },
};

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

function normalize(raw: string): string {
  // Accept "001", "nika-001", "NIKA-001", and normalize to NIKA-001 (zero-padded to 3).
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(/^(?:NIKA-)?(\d{1,4})$/);
  if (!match) return trimmed;
  return `NIKA-${match[1].padStart(3, '0')}`;
}

export default defineEventHandler((event) => {
  const raw = getRouterParam(event, 'code') ?? '';
  const code = normalize(raw);

  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600');
  setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8');

  const entry = REGISTRY[code];
  if (!entry) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown error code: ${code}`,
      data: {
        code,
        hint: 'See https://nika.sh/errors for the full catalog.',
        known: Object.keys(REGISTRY),
      },
    });
  }

  return entry;
});
