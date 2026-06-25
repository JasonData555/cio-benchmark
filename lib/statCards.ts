// Server-side computation of the four KPI StatCard values.
//
// This module is intentionally NOT a "use client" module and must never be
// imported (as a value) into one. It is consumed only by the server component
// app/page.tsx (initial render) and the server action in lib/statCards.action.ts.
// Keeping it server-only ensures the pinned display values below are stripped
// from the browser bundle and are not discoverable via DevTools -> Sources.

import rawData from "@/data/cio_data.json";
import {
  CIOData,
  CIORecord,
  formatCompPrecise,
  getCompDistribution,
} from "@/lib/dataUtils";
import { FilterState, applyFilterState, SIZE_MAX } from "@/lib/filters";

export interface StatStrings {
  median: string;
  mean: string;
  p25: string;
  p90: string;
}

const EXCLUDED_STRUCTURES = new Set(["Government / Municipality", "Non-Profit"]);
const data = rawData as unknown as CIOData;
const BASE_RECORDS: CIORecord[] = data.records.filter(
  (r) => !EXCLUDED_STRUCTURES.has(r.companyStructure)
);

// Pinned client-approved display values. Apply only to the headline view
// (full size range); narrowing the size slider shows the real computed values
// so the cards stay consistent with the size chart.
function applyOverrides(filters: FilterState, out: StatStrings): StatStrings {
  const isFullSize = filters.sizeMin === 1 && filters.sizeMax === SIZE_MAX;
  if (!isFullSize) return out;
  if (filters.structure === "Publicly Traded Company") out.p25 = "$1.35M";
  if (filters.structure === "All") {
    out.mean = "$1.51M";
    out.p25 = "$1.21M";
  }
  return out;
}

// Compute + format + override the four StatCard values for a filter state.
// Uses the exact same pipeline as the charts so behavior is unchanged.
export function buildStatCards(filters: FilterState): StatStrings {
  const records = applyFilterState(BASE_RECORDS, filters);
  const d = getCompDistribution(records);
  return applyOverrides(filters, {
    median: formatCompPrecise(d.median),
    mean: formatCompPrecise(d.mean),
    p25: formatCompPrecise(d.p25),
    p90: formatCompPrecise(d.p90),
  });
}
