"use client";

import { useEffect, useRef, useState } from "react";
import { DistributionStats, formatCompPrecise } from "@/lib/dataUtils";

interface Props {
  data: DistributionStats;
}

const BLUE = "#185FA5";
const BLUE_MID = "#378ADD";
const AMBER = "#BA7517";
const INK2 = "#444441";

const PAD_L = 56;
const PAD_R = 40;
const SVG_H = 110;
const AXIS_Y = SVG_H - 20;   // x-axis line y position
const BOX_CY = 45;            // center y of box plot
const BOX_H = 34;
const CAP_H = 12;
const D = 6;                  // mean diamond half-size

const TICK_COUNT = 6;

function tickFmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function niceRange(lo: number, hi: number): number[] {
  const step = (hi - lo) / (TICK_COUNT - 1);
  return Array.from({ length: TICK_COUNT }, (_, i) => lo + step * i);
}

const STATS_LABEL: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-ink-muted)",
  marginBottom: 3,
};

const STATS_VALUE: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 14,
  fontVariantNumeric: "tabular-nums",
};

export default function BoxPlotChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setWidth(el.clientWidth));
    obs.observe(el);
    setWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const lo = Math.floor((data.p10 * 0.9) / 200_000) * 200_000;
  const hi = Math.ceil((data.p90 * 1.1) / 200_000) * 200_000;

  const chartW = Math.max(0, width - PAD_L - PAD_R);
  const sc = (v: number) => PAD_L + ((v - lo) / (hi - lo)) * chartW;

  const { p20, p25, median, mean, p75, p90 } = data;
  const boxTop = BOX_CY - BOX_H / 2;
  const boxBot = BOX_CY + BOX_H / 2;

  const ticks = niceRange(lo, hi);

  const xP25  = sc(p25);
  const xMed  = sc(median);
  const xMean = sc(mean);
  const xP75  = sc(p75);
  const xP90  = sc(p90);

  const stats = [
    { label: "P25",    value: formatCompPrecise(p25),    color: INK2 },
    { label: "Median", value: formatCompPrecise(median), color: BLUE },
    { label: "Mean",   value: formatCompPrecise(mean),   color: AMBER },
    { label: "P75",    value: formatCompPrecise(p75),    color: INK2 },
    { label: "P90",    value: formatCompPrecise(p90),    color: INK2 },
  ];

  return (
    <section className="panel">
      <div className="box-panel-head">
        <h2 className="panel-title">Total Compensation Distribution</h2>
        <p className="panel-sub">North America · CIO · 2025</p>
      </div>

      <div className="box-legend">
        <span style={{ color: BLUE }}>— Median</span>
        <span style={{ color: AMBER }}>◆ Mean</span>
      </div>

      <div ref={containerRef} style={{ width: "100%", minHeight: 0 }}>
        {width > 0 && (
          <svg width={width} height={SVG_H} style={{ display: "block", overflow: "visible" }}>
            {/* Vertical grid lines at ticks */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={sc(t)} x2={sc(t)}
                y1={boxTop - 8} y2={AXIS_Y}
                stroke="var(--color-border)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ))}

            {/* X-axis line */}
            <line
              x1={PAD_L} x2={PAD_L + chartW}
              y1={AXIS_Y} y2={AXIS_Y}
              stroke="var(--color-border)"
              strokeWidth={1}
            />

            {/* X-axis tick labels */}
            {ticks.map((t, i) => (
              <text
                key={i}
                x={sc(t)}
                y={AXIS_Y + 14}
                textAnchor="middle"
                fill="var(--color-ink-tertiary)"
                fontSize={12}
                fontFamily="var(--font-mono)"
              >
                {tickFmt(t)}
              </text>
            ))}

            {/* Whisker line p20→p90 */}
            <line
              x1={sc(p20)} x2={xP90} y1={BOX_CY} y2={BOX_CY}
              stroke={INK2} strokeWidth={1.5}
            />
            {/* p20 cap */}
            <line
              x1={sc(p20)} x2={sc(p20)} y1={BOX_CY - CAP_H / 2} y2={BOX_CY + CAP_H / 2}
              stroke={INK2} strokeWidth={1.5}
            />
            {/* p90 cap */}
            <line
              x1={xP90} x2={xP90} y1={BOX_CY - CAP_H / 2} y2={BOX_CY + CAP_H / 2}
              stroke={INK2} strokeWidth={1.5}
            />

            {/* IQR box */}
            <rect
              x={xP25} y={boxTop}
              width={xP75 - xP25} height={BOX_H}
              fill="rgba(55,138,221,0.10)"
              stroke={BLUE_MID} strokeWidth={1.5}
              rx={2}
            />

            {/* Median line */}
            <line
              x1={xMed} x2={xMed} y1={boxTop} y2={boxBot}
              stroke={BLUE} strokeWidth={3}
            />

            {/* Mean diamond */}
            <polygon
              points={`${xMean},${BOX_CY - D} ${xMean + D},${BOX_CY} ${xMean},${BOX_CY + D} ${xMean - D},${BOX_CY}`}
              fill={AMBER}
            />
          </svg>
        )}
      </div>

      {/* Stats table */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingLeft: PAD_L,
          paddingRight: PAD_R,
          marginTop: 10,
          marginBottom: 8,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={STATS_LABEL}>{s.label}</div>
            <div style={{ ...STATS_VALUE, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <p className="footnote" style={{ marginTop: 4 }}>
        Peer group includes HubSpot · CrowdStrike · Datadog · ServiceNow · Workday ·
        Atlassian and comparable publicly traded enterprise SaaS companies
      </p>
    </section>
  );
}
