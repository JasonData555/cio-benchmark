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
- Deploy target: **Vercel** — pushing to GitHub `main` (`JasonData555/cio-benchmark`)
  auto-deploys production.

## File structure
```
app/
  layout.tsx     root layout, Cormorant Garamond + DM Sans + IBM Plex Mono fonts, metadata
  page.tsx       thin server component; computes initial StatCards, renders <Dashboard>
  globals.css    design tokens, layout classes
components/
  Dashboard.tsx       client dashboard; holds FilterState, calls chart aggregators
  FilterBar.tsx       sidebar: structure accordion dropdown + dual-range size slider
  StatCard.tsx        KPI card (label + value + optional accent color)
  CompMixChart.tsx    base/bonus/equity avg breakdown (stacked bar + metric callouts)
  CompBySizeChart.tsx avg total comp by company size band (recharts bar chart)
  BoxPlotChart / FunctionsChart / CompByIndustryChart  exist; not currently rendered
  Footer.tsx          source attribution + logo
data/
  cio_data.json           processed app data: { meta, records[] }
CIO-Comp-Data-final.csv    canonical source dataset (root-level)
lib/
  dataUtils.ts    types, formatters, stats helpers, chart aggregators
  filters.ts      FilterState type, applyFilterState, isDefaultState, SIZE_LABELS
  statCards.ts        server-only: buildStatCards() — the four KPI values + pinned overrides
  statCards.action.ts "use server" wrapper (getStatCards) called by Dashboard on filter change
scripts/
  csv-to-json.mjs  regenerates cio_data.json from CIO-Comp-Data-final.csv
public/
  hitch-logo.png  Hitch Partners logo
```

## Page layout
`.page-shell` CSS grid: `dashboard-header` (top bar with logo + title + n= count),
`sidebar` (FilterBar, fixed width), and `content-main` (right column). Inside `content-main`:
1. `.stats-row` — four `StatCard`s: Median, Mean, P25, P90 total comp (values from server, see below)
2. `.peer-group-banner` — static named peer-group callout
3. `.dashboard-grid` — two columns: `.area-mix` (CompMixChart) | `.area-size` (CompBySizeChart)

`body { overflow: hidden }` — everything must fit one viewport.

## Data flow
**Charts:** `data/cio_data.json` → `applyFilterState(records, filterState)` (`lib/filters.ts`)
→ aggregators in `lib/dataUtils.ts` → chart components, all client-side in `Dashboard.tsx`.
**Charts receive already-filtered, pre-aggregated arrays** — keep it that way.

**StatCards:** the four KPI values are computed **server-side** (pre-formatted strings):
`page.tsx` renders initial via `buildStatCards(defaultFilterState)`; `Dashboard.tsx` calls the
`getStatCards` server action on filter change. Override logic lives only in server-only
`lib/statCards.ts`, never shipping to the client. **Three values are pinned for the headline
(full size range) view** — All: Mean $1.51M, P25 $1.21M; Publicly Traded: P25 $1.35M; narrowing
the size slider shows real computed values.

### FilterState (lib/filters.ts)
```ts
interface FilterState {
  structure: string;  // "All" or a companyStructure value
  sizeMin: number;    // 1-based index into SIZE_ORDER (1–7)
  sizeMax: number;
}
```
Key exports: `applyFilterState`, `isDefaultState`, `SIZE_LABELS`, `defaultFilterState`

Government / Municipality and Non-Profit are excluded from `BASE_RECORDS` (in `Dashboard.tsx`
+ `lib/statCards.ts`) and from the structure dropdown.

### Key types & functions (lib/dataUtils.ts)
Types: `CIORecord`, `CIOData`, `PercentileStats`, `SizeStat`, `MixSlice`

Active aggregators: `compBySize`, `compMix` (used by `Dashboard.tsx`), `getCompDistribution`
(returns `{ median, mean, p25, p90 }`; used by `lib/statCards.ts` server-side). `compMix`
averages base/bonus/equity ignoring `null` (Excel semantics) via the `excelAvg` helper.
dataUtils also has a parallel `get*`-prefixed data-layer API + its own `FilterState`; it is
**not** wired into the app (the app uses `lib/filters.ts`).

Formatters: `formatCompPrecise` ("$X.XXM"/"$XK"), `formatCurrency`, `formatPercent`, `shortSize`.

### `cio_data.json` record shape
```jsonc
{
  "title","titleLevel","gender","location","city","region","tenure","prevCISO","companySize",
  "industry","companyStructure","reportsTo","currency","base","totalComp","teamSize","boardFreq",
  "bonus"/*number|null*/,"equity"/*number|null*/,"functions":["…"],"company","sizeOrder"
}
```

### Regenerating the data
Run `node scripts/csv-to-json.mjs` to rebuild `cio_data.json` from `CIO-Comp-Data-final.csv`.
Inclusion rule: **`totalComp > 0`** (no `Role_Bucket` filter). The dataset is the CIO
population including dual "CIO / CISO" title-holders that the CSV tags `Role_Bucket=CISO`;
filtering on `Role_Bucket` would wrongly drop them and break the per-structure averages.
`bonus` and `equity` are stored as `number | null` — a **blank** cell becomes `null` and is
excluded from averages (Excel `AVERAGE` semantics, where blank ≠ $0). The script prints a
per-row checksum (base+bonus+equity == totalComp) and asserts per-structure averages against
the client source-of-truth targets — it must print `Validation: PASSED`.

**Current state:** 144 records total; 121 after excluding Gov/Non-Profit (the dashboard
default `n`). Per-structure avg base/bonus/equity (the validated ground truth):
- Privately Held Company (n=62): $370,785 / $137,368 / $825,434
- Publicly Traded Company (n=59): $427,836 / $112,774 / $1,144,506

**Data provenance:** `CIO-Comp-Data-final.csv` was reconstructed verbatim from the client's
corrected paste; comp columns are checksum-verified, but non-comp free-text columns (functions
list, AI-survey answers) are placeholders — re-import the true master CSV if enabling the
unrendered charts.

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
- StatCard values are server-computed — never compute or expose them client-side.
- `BoxPlotChart` uses `ResizeObserver` (not `ResponsiveContainer`) — keep if re-enabled.

## Commands
- `npm run dev` — local dev at http://localhost:3000 · `npm run build` — production build
- `npm run lint` — ESLint · `npm start` — serve production build
