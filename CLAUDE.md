# CLAUDE.md — CIO Benchmark Dashboard

## What this is
A single-page, no-scroll, desktop-first data dashboard visualizing **CIO compensation
and governance** for North America, from a proprietary **Hitch Partners** survey.
Client-facing intelligence product: clean, credible, chart-led, minimal copy.

## Stack & constraints
- **Next.js 14 (App Router)**, React 18, TypeScript.
- **No Tailwind. No component libraries.** Styling is hand-written CSS in `app/globals.css`.
- **recharts** is the *only* added dependency — do not add others without a reason.
- Import alias: `@/*` → project root.
- Deploy target: **Vercel**.

## File structure
```
app/
  layout.tsx     root layout, Cormorant Garamond + DM Sans + IBM Plex Mono fonts, metadata
  page.tsx       dashboard (client component); holds FilterState + calls aggregators
  globals.css    design tokens, layout classes
components/
  FilterBar.tsx       sidebar: structure accordion dropdown + dual-range size slider
  StatCard.tsx        KPI card (label + value + optional accent color)
  CompMixChart.tsx    base/bonus/equity avg breakdown (stacked bar + metric callouts)
  CompBySizeChart.tsx avg total comp by company size band (recharts bar chart)
  BoxPlotChart.tsx    exists; not currently rendered — pure SVG box plot
  FunctionsChart.tsx  exists; not currently rendered — horizontal bar % chart
  CompByIndustryChart.tsx  exists; not currently rendered
  Footer.tsx          source attribution + logo
data/
  cio_data.json           processed app data: { meta, records[] }
CIO-Comp-Data-final.csv    canonical source dataset (root-level)
lib/
  dataUtils.ts    types, formatters, stats helpers, chart aggregators
  filters.ts      FilterState type, applyFilterState, isDefaultState, SIZE_LABELS
scripts/
  csv-to-json.mjs  regenerates cio_data.json from CIO-Comp-Data-Revised.csv
public/
  hitch-logo.png  Hitch Partners logo
```

## Page layout
`.page-shell` CSS grid: `dashboard-header` (top bar with logo + title + n= count),
`sidebar` (FilterBar, fixed width), and `content-main` (right column). Inside `content-main`:
1. `.stats-row` — four `StatCard`s: Median, Mean, P25, P90 total comp
2. `.peer-group-banner` — static named peer-group callout
3. `.dashboard-grid` — two columns: `.area-mix` (CompMixChart) | `.area-size` (CompBySizeChart)

`body { overflow: hidden }` — everything must fit one viewport.

## Data flow
`data/cio_data.json` → `applyFilterState(records, filterState)` (`lib/filters.ts`)
→ aggregators in `lib/dataUtils.ts` → chart components.
**Charts receive already-filtered, pre-aggregated arrays** — keep it that way.

### FilterState (lib/filters.ts)
```ts
interface FilterState {
  structure: string;  // "All" or a companyStructure value
  sizeMin: number;    // 1-based index into SIZE_ORDER (1–7)
  sizeMax: number;
}
```
Key exports: `applyFilterState`, `isDefaultState`, `SIZE_LABELS`, `defaultFilterState`

Government / Municipality and Non-Profit are excluded from the structure dropdown in `page.tsx`.

### Key types & functions (lib/dataUtils.ts)
Types: `CIORecord`, `CIOData`, `PercentileStats`, `SizeStat`, `MixSlice`

Active aggregators: `compBySize`, `compMix`, `getCompDistribution`
(`getCompDistribution` returns `{ median, mean, p25, p90 }` for the StatCards)

Formatters: `formatCompPrecise` ("$X.XXM"/"$XK"), `formatCurrency`, `formatPercent`,
`shortSize` (compact size-band labels for chart axes)

### `cio_data.json` record shape
```jsonc
{
  "title","titleLevel","gender","location","city","region","tenure","prevCISO",
  "companySize","industry","companyStructure","reportsTo","currency",
  "base","bonus"/*number|null*/,"equity"/*number|null*/,"totalComp","functions":["…"],"teamSize","boardFreq",
  "company","sizeOrder"
}
```

### Regenerating the data
Run `node scripts/csv-to-json.mjs` to rebuild `cio_data.json` from `CIO-Comp-Data-final.csv`.
Inclusion rule: **`totalComp > 0`** (no `Role_Bucket` filter). The dataset is the CIO
population including dual "CIO / CISO" title-holders that the CSV tags `Role_Bucket=CISO`;
filtering on `Role_Bucket` would wrongly drop them and break the per-structure averages.
`bonus` and `equity` are stored as `number | null` — a **blank** cell becomes `null` and is
excluded from averages (Excel `AVERAGE` semantics, where blank ≠ $0). The script's validation
asserts per-structure base/bonus/equity averages against the client's source-of-truth targets.

## CSS design tokens (globals.css)
Colors: `--color-bg` `--color-surface` `--color-blue` (#185fa5) `--color-blue-mid`
`--color-amber` `--color-amber-mid` `--color-champagne` `--color-ink*` (4 levels)
Chart palette: `--c1` (blue) `--c2` (blue-mid) `--c3` (amber-mid) `--c4` (IQR fill) `--c5` (champagne)
Type: `--font-display` (Cormorant Garamond) `--font-sans` (DM Sans) `--font-mono` (IBM Plex Mono)
Spacing: `--gap: 14px` `--radius: 10px`

## Conventions
- Anything using hooks/state/recharts must be `"use client"`.
- Filter option lists are **derived from data**, never hardcoded.
- Chart colors use `var(--cN)` CSS variables — palette changes go in `globals.css` only.
- `BoxPlotChart` uses `ResizeObserver` (not `ResponsiveContainer`) — keep it that way if re-enabled.

## Commands
- `npm run dev` — local dev at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm start` — serve production build
