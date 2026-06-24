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

## Layout / structure
```
app/
  layout.tsx     root layout, Cormorant Garamond + DM Sans + IBM Plex Mono fonts, metadata
  page.tsx       dashboard (client component); holds FilterState + calls aggregators
  globals.css    design tokens, sidebar+grid layout (see design.md)
components/
  FilterBar.tsx           vertical accordion sidebar: industry checkboxes, structure
                          dropdown, dual-range size slider, reset button, live n= count
  StatCard.tsx            KPI card (label + value + optional accent color)
  BoxPlotChart.tsx        total-comp distribution — custom ResizeObserver + pure SVG
                          (whisker, IQR box, median line, mean diamond, direct labels)
  CompBySizeChart.tsx     median total comp by company size (recharts horizontal bar)
  CompByIndustryChart.tsx median total comp by industry (horizontal bars, gradient color)
  CompMixChart.tsx        base/bonus/equity mix (stacked horizontal bar + metric callouts)
  FunctionsChart.tsx      functions under CIO authority (% respondents, horizontal bars)
  Footer.tsx              source attribution + logo
data/
  CIO-Comp-Data.csv       source dataset (143+ real records)
  cio_data.json           processed app data: { meta, records[] }
lib/
  dataUtils.ts    types, formatters, stats helpers, chart aggregators
  filters.ts      FilterState type, applyFilterState, isDefaultState, SIZE_LABELS
public/
  hitch-logo.png  Hitch Partners logo
```

## Page layout
The `.app` CSS grid has two columns: a fixed-width **sidebar** (FilterBar) on the left
and a **3-row × 2-column chart grid** on the right. `body { overflow: hidden }` — everything
must fit one viewport. Chart cells use `min-height: 0` so `ResponsiveContainer` can shrink.

## Data flow
`data/cio_data.json` → `applyFilterState(records, filterState)` (`lib/filters.ts`)
→ aggregators in `lib/dataUtils.ts` → chart components.
**Charts receive already-filtered, pre-aggregated arrays** — keep it that way.

### FilterState (lib/filters.ts)
```ts
interface FilterState {
  industries: string[];   // [] = all
  structure: string;      // "" = all
  sizeMin: number;        // index into SIZE_ORDER
  sizeMax: number;
}
```
Key exports: `applyFilterState`, `isDefaultState`, `SIZE_LABELS`, `DEFAULT_FILTER_STATE`

### Key types & functions (lib/dataUtils.ts)
Types: `CIORecord`, `CIOData`, `PercentileStats`, `SizeStat`, `IndustryStat`,
`MixSlice`, `FunctionStat`, `DistributionStats`

Aggregators: `compBySize`, `compByIndustry`, `compMix`, `functionsBreakdown`,
`getCompDistribution`, `percentileStats`, `median`

Formatters: `formatCompPrecise` ("$XM"/"$XK"), `formatCurrency`, `formatPercent`,
`shortSize` (abbreviates size-band labels)

### `cio_data.json` record shape
```jsonc
{
  "title","titleLevel","gender","location","city","region","tenure","prevCISO",
  "companySize","industry","companyStructure","reportsTo","currency",
  "base","bonus","equity","totalComp","functions":["…"],"teamSize","boardFreq",
  "company","sizeOrder"
}
```

### Regenerating the data
`cio_data.json` is produced from `CIO-Comp-Data-Revised.csv` via `scripts/csv-to-json.mjs`.
Run `node scripts/csv-to-json.mjs` to regenerate. The script maps CSV columns to camelCase
JSON fields, strips `$`/commas from money columns, splits the multi-value "functions" column
into an array, derives `sizeOrder`, and includes only rows where `Role_Bucket === "CIO"` and
`totalComp > 0` (139 records). Canonical source file: `CIO-Comp-Data-Revised.csv` (root).

## CSS design tokens (globals.css)
Colors: `--color-bg`, `--color-surface`, `--color-blue` (#185fa5), `--color-blue-mid`,
`--color-amber`, `--color-amber-mid`, `--color-champagne`, `--color-ink*` (4 levels)
Chart palette: `--c1` (blue) `--c2` (blue-mid) `--c3` (amber-mid) `--c4` (IQR fill) `--c5` (champagne)
Type: `--font-display` (Cormorant Garamond) `--font-sans` (DM Sans) `--font-mono` (IBM Plex Mono)
Spacing: `--gap: 14px` `--radius: 10px`

## Conventions
- Anything using hooks/state/recharts must be `"use client"`.
- Filter option lists are **derived from data**, never hardcoded.
- Chart colors use `var(--cN)` CSS variables — palette changes go in `globals.css` only.
- `BoxPlotChart` uses `ResizeObserver` (not `ResponsiveContainer`) — keep it that way.

## Commands
- `npm run dev` — local dev at http://localhost:3000
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm start` — serve production build
