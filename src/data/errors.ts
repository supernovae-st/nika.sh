// Build-time load of /public/errors/catalog.json.
// The catalog is the seed for NIKA-XXX pages; long-term it'll be replaced
// by the generated output of the nika-error L0 crate.

import catalog from '../../public/errors/catalog.json' with { type: 'json' };

export interface NikaError {
  code: string;
  title: string;
  summary: string;
  help: string;
  example?: string;
  docs?: string;
  related?: string[];
  category: string;
}

export interface ErrorCatalog {
  $schema?: string;
  version: number;
  updated: string;
  description?: string;
  errors: Record<string, NikaError>;
}

const typedCatalog = catalog as unknown as ErrorCatalog;

export const errors = typedCatalog.errors;
export const errorCodes = Object.keys(typedCatalog.errors);
export const errorCatalogMeta = {
  version: typedCatalog.version,
  updated: typedCatalog.updated,
  count: errorCodes.length,
};

export function getError(code: string): NikaError | undefined {
  return errors[code.toUpperCase()];
}

export function getAllErrors(): NikaError[] {
  return Object.values(errors).sort((a, b) => a.code.localeCompare(b.code));
}
