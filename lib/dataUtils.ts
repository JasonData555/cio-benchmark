// Data types + aggregation/formatting helpers for the CIO benchmark dashboard.
// All aggregators take an already-filtered array of records so charts stay in
// sync with the active FilterBar selection.

import rawData from "@/data/cio_data.json";

export interface CIORecord {
  title: string;
  titleLevel: string;
  gender: string;
  location: string;
  city: string;
  region: string;
  tenure: number;
  prevCISO: string;
  companySize: string;
  industry: string;
  companyStructure: string;
  reportsTo: string;
  currency: string;
  base: number;
  bonus: number | null; // null = blank cell (excluded from averages, Excel AVERAGE semantics)
  equity: number | null; // null = blank cell
  totalComp: number;
  functions: string[];
  teamSize: number;
  boardFreq: string;
  company: string;
  sizeOrder: number;
}

export interface CIOData {
  meta: {
    title: string;
    region: string;
    source: string;
    year: number;
    currency: string;
    n: number;
  };
  records: CIORecord[];
}

// Logical ordering for company-size bands (smallest -> largest).
export const SIZE_ORDER = [
  "< 250 employees",
  "250 - 499 employees",
  "500 - 999 employees",
  "1000 - 4999 employees",
  "5000 - 9,999 employees",
  "10,000 - 25,000 employees",
  "25,000+ employees",
];

// Compact size-band label for tight chart axes.
export function shortSize(band: string): string {
  return band
    .replace(/\s*employees/i, "")
    .replace("< 250", "<250")
    .replace("25,000+", "25K+")
    .replace("10,000 - 25,000", "10-25K")
    .replace("5000 - 9,999", "5-10K")
    .replace("1000 - 4999", "1-5K")
    .replace("500 - 999", "500-999")
    .replace("250 - 499", "250-499")
    .trim();
}

// ---- formatters ----

export function formatCompPrecise(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export function formatCurrency(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "$0";
  if (Math.abs(n) >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (Math.abs(n) >= 1_000) {
    return `$${Math.round(n / 1_000)}K`;
  }
  return `$${Math.round(n)}`;
}

export function formatPercent(n: number, digits = 0): string {
  return `${n.toFixed(digits)}%`;
}

// ---- statistics ----

export function median(values: number[]): number {
  return percentile(values, 50);
}

export function percentile(values: number[], p: number): number {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return 0;
  if (v.length === 1) return v[0];
  const idx = (p / 100) * (v.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return v[lo];
  return v[lo] + (v[hi] - v[lo]) * (idx - lo);
}

export interface PercentileStats {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  n: number;
}

export function percentileStats(values: number[]): PercentileStats {
  const v = values.filter((x) => Number.isFinite(x) && x > 0);
  if (v.length === 0) {
    return { min: 0, p25: 0, median: 0, p75: 0, max: 0, n: 0 };
  }
  return {
    min: Math.min(...v),
    p25: percentile(v, 25),
    median: percentile(v, 50),
    p75: percentile(v, 75),
    max: Math.max(...v),
    n: v.length,
  };
}

// ---- chart aggregators ----

export interface SizeStat extends PercentileStats {
  sizeBand: string;
  label: string;
  mean: number;
}

const SMALL_BANDS = new Set(["< 250 employees", "250 - 499 employees", "500 - 999 employees"]);

// Total-comp percentile stats per company-size band, in logical order.
// The three smallest bands (<250, 250-499, 500-999) are merged into "< 1,000".
export function compBySize(records: CIORecord[]): SizeStat[] {
  const avg = (vals: number[]) =>
    vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;

  const smallVals = records
    .filter((r) => SMALL_BANDS.has(r.companySize))
    .map((r) => r.totalComp);
  const smallStat = percentileStats(smallVals);

  const result: SizeStat[] = [];
  if (smallStat.n > 0) {
    result.push({ sizeBand: "< 1,000 employees", label: "< 1,000", ...smallStat, mean: avg(smallVals) });
  }

  for (const band of SIZE_ORDER.slice(3)) {
    const vals = records.filter((r) => r.companySize === band).map((r) => r.totalComp);
    const stat = percentileStats(vals);
    if (stat.n > 0) {
      result.push({ sizeBand: band, label: shortSize(band), ...stat, mean: avg(vals) });
    }
  }

  return result;
}

export interface IndustryStat {
  industry: string;
  median: number;
  n: number;
}

// Median total comp per industry, sorted desc, limited to industries with
// enough respondents to be meaningful, capped at topN.
export function compByIndustry(records: CIORecord[], topN = 8, minN = 2): IndustryStat[] {
  const groups = new Map<string, number[]>();
  for (const r of records) {
    if (!r.industry) continue;
    if (!groups.has(r.industry)) groups.set(r.industry, []);
    groups.get(r.industry)!.push(r.totalComp);
  }
  return [...groups.entries()]
    .map(([industry, vals]) => ({ industry, median: median(vals), n: vals.length }))
    .filter((g) => g.n >= minN)
    .sort((a, b) => b.median - a.median)
    .slice(0, topN);
}

export interface MixSlice {
  component: string;
  value: number;
  pct: number;
}

// Mean of a component across records, ignoring null (blank) cells — matches
// Excel AVERAGE semantics (blank excluded from the denominator, $0 included).
function excelAvg(values: Array<number | null>): number {
  const filled = values.filter((v): v is number => v != null);
  return filled.length > 0 ? filled.reduce((s, v) => s + v, 0) / filled.length : 0;
}

// Average pay mix across records: base / bonus / equity as a % of total.
export function compMix(records: CIORecord[]): MixSlice[] {
  if (records.length === 0) {
    return [
      { component: "Base", value: 0, pct: 0 },
      { component: "Bonus", value: 0, pct: 0 },
      { component: "Equity", value: 0, pct: 0 },
    ];
  }
  const base = excelAvg(records.map((r) => r.base));
  const bonus = excelAvg(records.map((r) => r.bonus));
  const equity = excelAvg(records.map((r) => r.equity));
  const total = base + bonus + equity || 1;
  return [
    { component: "Base", value: base, pct: (base / total) * 100 },
    { component: "Bonus", value: bonus, pct: (bonus / total) * 100 },
    { component: "Equity", value: equity, pct: (equity / total) * 100 },
  ];
}

export interface FunctionStat {
  function: string;
  count: number;
  pct: number;
}

// How many CIOs own each function, sorted desc, top N.
export function functionsBreakdown(records: CIORecord[], topN = 10): FunctionStat[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const fn of r.functions) {
      counts.set(fn, (counts.get(fn) ?? 0) + 1);
    }
  }
  const total = records.length || 1;
  return [...counts.entries()]
    .map(([fn, count]) => ({ function: fn, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ============================================================
// Typed data-layer API (FilterState-driven). Additive to the
// helpers above; consumed by the next round of UI wiring.
// ============================================================

// Full dataset loaded once at module scope.
const ALL_RECORDS: CIORecord[] = (rawData as unknown as CIOData).records;

// Company-size band -> sort order (1..7), derived from SIZE_ORDER.
export const SIZE_ORDER_MAP: Record<string, number> = Object.fromEntries(
  SIZE_ORDER.map((band, i) => [band, i + 1])
);

export function sizeOrderOf(band: string): number {
  return SIZE_ORDER_MAP[band] ?? 0;
}

export interface FilterState {
  industries: string[];
  companyStructures: string[];
  sizeRange: [number, number];
}

// Filter the full dataset. Empty industries/companyStructures = no constraint.
export function getFilteredData(filters: FilterState): CIORecord[] {
  const { industries, companyStructures, sizeRange } = filters;
  const [minSize, maxSize] = sizeRange;
  return ALL_RECORDS.filter((r) => {
    if (industries.length > 0 && !industries.includes(r.industry)) return false;
    if (companyStructures.length > 0 && !companyStructures.includes(r.companyStructure))
      return false;
    if (r.sizeOrder < minSize || r.sizeOrder > maxSize) return false;
    return true;
  });
}

export interface DistributionStats {
  p10: number;
  p20: number;
  p25: number;
  median: number;
  mean: number;
  p75: number;
  p90: number;
}

// Total-comp distribution percentiles + mean.
export function getCompDistribution(data: CIORecord[]): DistributionStats {
  const values = data.map((r) => r.totalComp).filter((v) => v > 0);
  const mean =
    values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  return {
    p10: percentile(values, 10),
    p20: percentile(values, 20),
    p25: percentile(values, 25),
    median: percentile(values, 50),
    mean,
    p75: percentile(values, 75),
    p90: percentile(values, 90),
  };
}

export interface CompBySizeStat {
  label: string;
  median: number;
  mean: number;
  n: number;
}

// Median/mean total comp grouped by company-size band, ascending by sizeOrder.
export function getCompBySize(data: CIORecord[]): CompBySizeStat[] {
  const groups = new Map<string, number[]>();
  for (const r of data) {
    if (!r.companySize) continue;
    if (!groups.has(r.companySize)) groups.set(r.companySize, []);
    groups.get(r.companySize)!.push(r.totalComp);
  }
  return [...groups.entries()]
    .map(([label, vals]) => ({
      label,
      median: median(vals),
      mean: vals.reduce((s, v) => s + v, 0) / vals.length,
      n: vals.length,
    }))
    .sort((a, b) => sizeOrderOf(a.label) - sizeOrderOf(b.label));
}

export interface CompByIndustryStat {
  industry: string;
  median: number;
  n: number;
}

// Median total comp by industry; only industries with n >= 3, sorted desc.
export function getCompByIndustry(data: CIORecord[]): CompByIndustryStat[] {
  const groups = new Map<string, number[]>();
  for (const r of data) {
    if (!r.industry) continue;
    if (!groups.has(r.industry)) groups.set(r.industry, []);
    groups.get(r.industry)!.push(r.totalComp);
  }
  return [...groups.entries()]
    .map(([industry, vals]) => ({ industry, median: median(vals), n: vals.length }))
    .filter((g) => g.n >= 3)
    .sort((a, b) => b.median - a.median);
}

export interface CompMixResult {
  base: number;
  bonus: number;
  equity: number;
}

// Average pay mix: mean of each component as a % of mean total comp.
export function getCompMix(data: CIORecord[]): CompMixResult {
  if (data.length === 0) return { base: 0, bonus: 0, equity: 0 };
  const base = excelAvg(data.map((r) => r.base));
  const bonus = excelAvg(data.map((r) => r.bonus));
  const equity = excelAvg(data.map((r) => r.equity));
  const total = base + bonus + equity || 1;
  return {
    base: (base / total) * 100,
    bonus: (bonus / total) * 100,
    equity: (equity / total) * 100,
  };
}

export interface FunctionFrequency {
  function: string;
  count: number;
  pct: number;
}

// Explode functions, count frequency, % of records owning each, sorted desc.
export function getFunctions(data: CIORecord[]): FunctionFrequency[] {
  const counts = new Map<string, number>();
  for (const r of data) {
    for (const fn of r.functions) {
      counts.set(fn, (counts.get(fn) ?? 0) + 1);
    }
  }
  const total = data.length || 1;
  return [...counts.entries()]
    .map(([fn, count]) => ({ function: fn, count, pct: (count / total) * 100 }))
    .sort((a, b) => b.count - a.count);
}

export function getUniqueIndustries(data: CIORecord[]): string[] {
  return [...new Set(data.map((r) => r.industry).filter(Boolean))].sort();
}

export function getUniqueStructures(data: CIORecord[]): string[] {
  return [...new Set(data.map((r) => r.companyStructure).filter(Boolean))].sort();
}

export function getSizeRange(): [number, number] {
  return [1, 7];
}
