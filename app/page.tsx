"use client";

import { useMemo, useState } from "react";
import rawData from "@/data/cio_data.json";
import {
  CIOData,
  compByIndustry,
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
import BoxPlotChart from "@/components/BoxPlotChart";
import CompBySizeChart from "@/components/CompBySizeChart";
import CompByIndustryChart from "@/components/CompByIndustryChart";
import CompMixChart from "@/components/CompMixChart";
import Footer from "@/components/Footer";

const data = rawData as unknown as CIOData;
const allIndustries = [...new Set(data.records.map((r) => r.industry))].filter(Boolean).sort();
const allStructures = [...new Set(data.records.map((r) => r.companyStructure))].filter(Boolean).sort();

export default function Home() {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  const records = useMemo(
    () => applyFilterState(data.records, filters),
    [filters]
  );

  const stats = useMemo(() => ({
    n: records.length,
    ...getCompDistribution(records),
  }), [records]);

  const bySize = useMemo(() => compBySize(records), [records]);
  const byIndustry = useMemo(() => compByIndustry(records, 15, 1), [records]);
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
        industries={allIndustries}
        structures={allStructures}
      />

      <div className="content-main">
        <section className="stats-row">
          <StatCard label="Median Total Comp" value={formatCompPrecise(stats.median)} accent="blue" />
          <StatCard label="Mean Total Comp"   value={formatCompPrecise(stats.mean)} />
          <StatCard label="25th Percentile"   value={formatCompPrecise(stats.p25)} />
          <StatCard label="90th Percentile"   value={formatCompPrecise(stats.p90)} />
        </section>

        <section className="dashboard-grid">
          <div className="area-mix">
            <CompMixChart data={mix} />
          </div>
          <div className="area-box">
            <BoxPlotChart data={stats} />
          </div>
          <div className="area-size">
            <CompBySizeChart data={bySize} />
          </div>
          <div className="area-industry">
            <CompByIndustryChart data={byIndustry} />
          </div>
        </section>
      </div>

      <Footer
        source={data.meta.source}
        region={data.meta.region}
        year={data.meta.year}
        n={data.meta.n}
      />
    </div>
  );
}
