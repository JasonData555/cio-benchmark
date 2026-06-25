"use client";

import { useEffect, useMemo, useState } from "react";
import rawData from "@/data/cio_data.json";
import { CIOData, compBySize, compMix } from "@/lib/dataUtils";
import {
  FilterState,
  applyFilterState,
  defaultFilterState,
} from "@/lib/filters";
import { getStatCards } from "@/lib/statCards.action";
import type { StatStrings } from "@/lib/statCards";
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

export default function Dashboard({ initialStats }: { initialStats: StatStrings }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  // StatCard values come from the server action only — they are never computed
  // on the client, so the real per-card numbers never reach the DOM.
  const [statCards, setStatCards] = useState<StatStrings>(initialStats);

  const records = useMemo(
    () => applyFilterState(BASE_RECORDS, filters),
    [filters]
  );

  useEffect(() => {
    let active = true;
    getStatCards(filters).then((s) => {
      if (active) setStatCards(s);
    });
    return () => {
      active = false;
    };
  }, [filters]);

  const n = records.length;
  const bySize = useMemo(() => compBySize(records), [records]);
  const mix = useMemo(() => compMix(records), [records]);

  return (
    <div className="page-shell">
      <header className="dashboard-header">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hitch-logo.png" height={28} alt="Hitch Partners" />
        <h1 className="header-title">CIO Compensation Benchmark</h1>
        <span className="header-right">{data.meta.region} · {data.meta.year} · n={n}</span>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        counts={{ total: n }}
        structures={allStructures}
      />

      <div className="content-main">
        <section className="stats-row">
          <StatCard label="Median Total Comp" value={statCards.median} accent="blue" />
          <StatCard label="Mean Total Comp"   value={statCards.mean} />
          <StatCard label="25th Percentile"   value={statCards.p25} />
          <StatCard label="90th Percentile"   value={statCards.p90} />
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
