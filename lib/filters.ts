// Filter state + helpers. Options are derived from the data itself so the UI
// stays correct if the underlying dataset changes.

import { CIORecord, SIZE_ORDER } from "./dataUtils";

// ---- New FilterState (pill/slider/dropdown UI) ----

export interface FilterState {
  structure: string;    // "All" or a companyStructure value
  sizeMin: number;      // 1–7 (1-based index into SIZE_ORDER)
  sizeMax: number;      // 1–7
}

export const SIZE_LABELS: Record<number, string> = {
  1: "<250",
  2: "250–499",
  3: "500–999",
  4: "1,000–4,999",
  5: "5,000–9,999",
  6: "10,000–25,000",
  7: "25,000+",
};

export const SIZE_MAX = SIZE_ORDER.length; // 7

export const defaultFilterState: FilterState = {
  structure: "All",
  sizeMin: 1,
  sizeMax: SIZE_MAX,
};

export function isDefaultState(fs: FilterState): boolean {
  return (
    fs.structure === "All" &&
    fs.sizeMin === 1 &&
    fs.sizeMax === SIZE_MAX
  );
}

export function applyFilterState(records: CIORecord[], fs: FilterState): CIORecord[] {
  return records.filter((r) => {
    if (fs.structure !== "All" && r.companyStructure !== fs.structure) return false;
    const idx = SIZE_ORDER.indexOf(r.companySize) + 1; // 1-based; 0 if not found
    if (idx > 0 && (idx < fs.sizeMin || idx > fs.sizeMax)) return false;
    return true;
  });
}

export interface Filters {
  industry: string;     // "All" or a specific industry
  companySize: string;  // "All" or a specific size band
  gender: string;       // "All" or a specific gender
}

export const ALL = "All";

export const defaultFilters: Filters = {
  industry: ALL,
  companySize: ALL,
  gender: ALL,
};

export interface FilterOptions {
  industry: string[];
  companySize: string[];
  gender: string[];
}

// Distinct, sorted option lists. Company sizes follow the logical SIZE_ORDER;
// everything else is alphabetical. Each list is prefixed with "All".
export function filterOptions(records: CIORecord[]): FilterOptions {
  const distinct = (key: keyof CIORecord) =>
    [...new Set(records.map((r) => r[key] as string))].filter(Boolean);

  const sizes = distinct("companySize").sort(
    (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)
  );

  return {
    industry: [ALL, ...distinct("industry").sort()],
    companySize: [ALL, ...sizes],
    gender: [ALL, ...distinct("gender").sort()],
  };
}

export function applyFilters(records: CIORecord[], filters: Filters): CIORecord[] {
  return records.filter((r) => {
    if (filters.industry !== ALL && r.industry !== filters.industry) return false;
    if (filters.companySize !== ALL && r.companySize !== filters.companySize) return false;
    if (filters.gender !== ALL && r.gender !== filters.gender) return false;
    return true;
  });
}

export function isDefault(filters: Filters): boolean {
  return (
    filters.industry === ALL &&
    filters.companySize === ALL &&
    filters.gender === ALL
  );
}
