"use client";

import {
  CartesianGrid,
  ComposedChart,
  Customized,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { DistributionStats, formatCompPrecise } from "@/lib/dataUtils";

interface Props {
  data: DistributionStats;
}

const BLUE = "#185FA5";
const BLUE_MID = "#378ADD";
const AMBER = "#BA7517";

function tickFmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

export default function BoxPlotChart({ data }: Props) {
  const lo = Math.floor((data.p10 * 0.9) / 200_000) * 200_000;
  const hi = Math.ceil((data.p90 * 1.1) / 200_000) * 200_000;

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

      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart
          data={[{ v: lo }]}
          margin={{ top: 64, right: 44, bottom: 8, left: 64 }}
        >
          <CartesianGrid
            vertical={true}
            horizontal={false}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="v"
            type="number"
            domain={[lo, hi]}
            tickCount={6}
            tickFormatter={tickFmt}
            tick={{
              fill: "var(--color-ink-tertiary)",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
            }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-border)" }}
          />
          <Customized
            component={(props: unknown) =>
              HorizontalBox(props as RechartsCustomizedProps, data)
            }
          />
        </ComposedChart>
      </ResponsiveContainer>

      <p className="footnote" style={{ marginTop: 8 }}>
        Peer group includes HubSpot · CrowdStrike · Datadog · ServiceNow · Workday ·
        Atlassian and comparable publicly traded enterprise SaaS companies
      </p>
    </section>
  );
}

interface RechartsCustomizedProps {
  xAxisMap?: Record<string, { scale?: (v: number) => number }>;
  offset?: { top: number; left: number; width: number; height: number };
}

interface LabelProps {
  x: number;
  y: number;
  name: string;
  value: string;
  color: string;
}

function ChartLabel({ x, y, name, value, color }: LabelProps) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill={color}
        fontSize={9}
        fontFamily="var(--font-sans)"
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        {value}
      </text>
    </g>
  );
}

function HorizontalBox(
  { xAxisMap, offset }: RechartsCustomizedProps,
  dist: DistributionStats
) {
  if (!xAxisMap || !offset) return null;
  const xAxis = Object.values(xAxisMap)[0];
  if (!xAxis?.scale) return null;

  const sc = (v: number) => xAxis.scale!(v);
  const { p20, p25, median, mean, p75, p90 } = dist;

  const cy = offset.top + offset.height / 2;
  const BOX_H = 36;
  const CAP_H = 14;
  const D = 7; // mean diamond half-size

  const xP20 = sc(p20);
  const xP25 = sc(p25);
  const xMed = sc(median);
  const xMean = sc(mean);
  const xP75 = sc(p75);
  const xP90 = sc(p90);

  const boxTop = cy - BOX_H / 2;
  const boxBot = cy + BOX_H / 2;

  // Label rows: A = outer (p20, median, p90), B = inner (p25, p75), C = below (mean)
  const LA = boxTop - 28;
  const LB = boxTop - 14;
  const LC = boxBot + 18;

  const INK2 = "var(--color-ink-secondary)";

  return (
    <g>
      {/* whisker line p20→p90 */}
      <line
        x1={xP20} x2={xP90} y1={cy} y2={cy}
        stroke={INK2} strokeWidth={1.5}
      />
      {/* p20 cap */}
      <line
        x1={xP20} x2={xP20} y1={cy - CAP_H / 2} y2={cy + CAP_H / 2}
        stroke={INK2} strokeWidth={1.5}
      />
      {/* p90 cap */}
      <line
        x1={xP90} x2={xP90} y1={cy - CAP_H / 2} y2={cy + CAP_H / 2}
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
      {/* median line */}
      <line
        x1={xMed} x2={xMed} y1={boxTop} y2={boxBot}
        stroke={BLUE} strokeWidth={3}
      />
      {/* mean diamond */}
      <polygon
        points={`${xMean},${cy - D} ${xMean + D},${cy} ${xMean},${cy + D} ${xMean - D},${cy}`}
        fill={AMBER}
      />

      {/* labels */}
      <ChartLabel x={xP20}  y={LA} name="P20"    value={formatCompPrecise(p20)}    color={INK2} />
      <ChartLabel x={xP25}  y={LB} name="P25"    value={formatCompPrecise(p25)}    color={INK2} />
      <ChartLabel x={xMed}  y={LA} name="Median" value={formatCompPrecise(median)} color={BLUE} />
      <ChartLabel x={xP75}  y={LB} name="P75"    value={formatCompPrecise(p75)}    color={INK2} />
      <ChartLabel x={xP90}  y={LA} name="P90"    value={formatCompPrecise(p90)}    color={INK2} />
      <ChartLabel x={xMean} y={LC} name="Mean"   value={formatCompPrecise(mean)}   color={AMBER} />
    </g>
  );
}
