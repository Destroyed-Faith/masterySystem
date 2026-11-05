/**
 * Optional Profession suggestions. Not a whitelist — a custom name is always legal.
 *
 * The data is the author-approved 90-entry list in five categories (Trades,
 * Wilderness, Society, Conflict, Knowledge). Characters never store catalogue
 * entries; they store their own name, origin, scope, and rank. Replacing this
 * list therefore never touches a learned or custom Profession on an actor.
 */

import catalogue from './data/professions-catalogue-data.js';

export interface ProfessionCatalogueEntry {
  id?: string;
  name: string;
  category: string;
  scope_example: string;
  type?: string;
  source?: string;
}

interface CatalogueFile {
  catalogue_version?: string;
  not_closed_list?: boolean;
  categories?: string[];
  entries?: ProfessionCatalogueEntry[];
}

const data = catalogue as CatalogueFile;

export const PROFESSION_CATALOGUE_VERSION = String(data.catalogue_version ?? '');

export const PROFESSION_CATALOGUE_NOT_CLOSED_LIST = data.not_closed_list !== false;

export const PROFESSION_CATALOGUE: readonly ProfessionCatalogueEntry[] = Array.isArray(data.entries)
  ? data.entries
  : [];

/** Category order as printed in the rulebook. */
export const PROFESSION_CATALOGUE_CATEGORIES: readonly string[] = Array.isArray(data.categories) && data.categories.length
  ? data.categories
  : [...new Set(PROFESSION_CATALOGUE.map((entry) => entry.category).filter(Boolean))];

export function professionCatalogueCategories(): string[] {
  return [...PROFESSION_CATALOGUE_CATEGORIES];
}

/**
 * Filter suggestions by category and a free-text query over name and scope.
 * An empty category or query matches everything.
 */
export function searchProfessionCatalogue(opts: {
  query?: string;
  category?: string;
} = {}): ProfessionCatalogueEntry[] {
  const category = String(opts.category ?? '').trim();
  const query = String(opts.query ?? '').trim().toLowerCase();
  return PROFESSION_CATALOGUE.filter((entry) => {
    if (category && entry.category !== category) return false;
    if (!query) return true;
    return (
      entry.name.toLowerCase().includes(query) ||
      entry.scope_example.toLowerCase().includes(query)
    );
  });
}

/** Look up one suggestion by its exact name (case-insensitive). */
export function findProfessionCatalogueEntry(name: string): ProfessionCatalogueEntry | null {
  const key = String(name ?? '').trim().toLowerCase();
  if (!key) return null;
  return PROFESSION_CATALOGUE.find((entry) => entry.name.toLowerCase() === key) ?? null;
}
