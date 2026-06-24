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
const SVG_H = 160;
const AXIS_Y = SVG_H - 20;   // x-axis line y position
const BOX_CY = 72;            // center y of box plot
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

interface LabelProps {
  x: number;
  y: number;
  name: string;
  value: string;
  color: string;
  anchor?: "start" | "middle" | "end";
}

function ChartLabel({ x, y, name, value, color, anchor = "middle" }: LabelProps) {
  return (
    <g>
      <text x={x} y={y} textAnchor={anchor} fill={color} fontSize={12} fontFamily="var(--font-sans)">
        {name}
      </text>
      <text x={x} y={y + 15} textAnchor={anchor} fill={color} fontSize={13} fontFamily="var(--font-mono)">
        {value}
      </text>
    </g>
  );
}

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

  // Label rows above and below
  const LA = boxTop - 34;   // labels above box (p25, median, p75)
  const LC = boxBot + 22;   // mean label below

  const ticks = niceRange(lo, hi);

  const xP25  = sc(p25);
  const xMed  = sc(median);
  const xMean = sc(mean);
  const xP75  = sc(p75);
  const xP90  = sc(p90);

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

      <div ref={containerRef} style={{ width: "100%", flex: 1, minHeight: 0 }}>
        {width > 0 && (
          <svg width={width} height={SVG_H} style={{ display: "block", overflow: "visible" }}>
            {/* Vertical grid lines at ticks */}
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={sc(t)} x2={sc(t)}
                y1={boxTop - 36} y2={AXIS_Y}
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

            {/* Labels */}
            <ChartLabel x={xP25}      y={LA}            name="P25"    value={formatCompPrecise(p25)}    color={INK2}  anchor="start" />
            <ChartLabel x={xMed}      y={LA}            name="Median" value={formatCompPrecise(median)} color={BLUE}  anchor="middle" />
            <ChartLabel x={xP75}      y={LA}            name="P75"    value={formatCompPrecise(p75)}    color={INK2}  anchor="end" />
            <ChartLabel x={xP90 + 10} y={BOX_CY - 10}  name="P90"    value={formatCompPrecise(p90)}    color={INK2}  anchor="start" />
            <ChartLabel x={xMean}     y={LC}            name="Mean"   value={formatCompPrecise(mean)}   color={AMBER} anchor="middle" />
          </svg>
        )}
      </div>

      <p className="footnote" style={{ marginTop: 4 }}>
        Peer group includes HubSpot · CrowdStrike · Datadog · ServiceNow · Workday ·
        Atlassian and comparable publicly traded enterprise SaaS companies
      </p>
    </section>
  );
}
