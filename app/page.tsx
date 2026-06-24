"use client";

import { useMemo, useState } from "react";
import rawData from "@/data/cio_data.json";
import {
  CIOData,
  compBySize,
  compMix,
  formatCompPrecise,
  getCompDistribution,
} from "@/lib/dataUtils";
import {
  FilterState,
  applyFilterState,
  defaultFilterState,
} from "@/lib/filters";
import FilterBar from "@/components/FilterBar";
import StatCard from "@/components/StatCard";
import CompBySizeChart from "@/components/CompBySizeChart";
import CompMixChart from "@/components/CompMixChart";
import Footer from "@/components/Footer";

const EXCLUDED_STRUCTURES = new Set(["Government / Municipality", "Non-Profit"]);

const data = rawData as unknown as CIOData;
const BASE_RECORDS = data.records.filter((r) => !EXCLUDED_STRUCTURES.has(r.companyStructure));
const allStructures = [...new Set(BASE_RECORDS.map((r) => r.companyStructure))]
  .filter((s) => Boolean(s) && !EXCLUDED_STRUCTURES.has(s))
  .sort();

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  const records = useMemo(
    () => applyFilterState(BASE_RECORDS, filters),
    [filters]
  );

  const stats = useMemo(() => ({
    n: records.length,
    ...getCompDistribution(records),
  }), [records]);

  const bySize = useMemo(() => compBySize(records), [records]);
  const mix = useMemo(() => compMix(records), [records]);

  return (
    <div className="page-shell">
      <header className="dashboard-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hitch-logo.png" height={28} alt="Hitch Partners" />
        <h1 className="header-title">CIO Compensation Benchmark</h1>
        <span className="header-right">{data.meta.region} · {data.meta.year} · n={stats.n}</span>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ total: stats.n }}
        structures={allStructures}
      />

      <div className="content-main">
        <section className="stats-row">
          <StatCard label="Median Total Comp" value={formatCompPrecise(stats.median)} accent="blue" />
          <StatCard label="Mean Total Comp"   value={formatCompPrecise(stats.mean)} />
          <StatCard label="25th Percentile"   value={formatCompPrecise(stats.p25)} />
          <StatCard label="90th Percentile"   value={formatCompPrecise(stats.p90)} />
        </section>

        <div className="peer-group-banner">
          Peer Group includes: Informatica, Asana, Black Duck, BlackLine, Coursera, Freshworks, Twitch, Zscaler, Five9, PagerDuty, Bill.com, MongoDB, Mozilla, Guidewire Software, Samsara, and Zuora
        </div>

        <section className="dashboard-grid">
          <div className="area-mix">
            <CompMixChart data={mix} />
          </div>
          <div className="area-size">
            <CompBySizeChart data={bySize} />
          </div>
        </section>
      </div>

      <Footer
        source={data.meta.source}
        region={data.meta.region}
        year={data.meta.year}
        n={BASE_RECORDS.length}
      />
    </div>
  );
}
