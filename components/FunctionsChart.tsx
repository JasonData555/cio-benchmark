"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { FunctionStat, formatPercent } from "@/lib/dataUtils";

interface Props {
  data: FunctionStat[];
}

function truncateLabel(s: string): string {
  return s.length <= 28 ? s : s.slice(0, 27) + "…";
}

function rankFill(index: number, total: number): string {
  if (index < 3) return "var(--color-blue)";
  const t = (index - 3) / Math.max(total - 4, 1);
  const r = Math.round(0x37 + (0xb5 - 0x37) * t);
  const g = Math.round(0x8a + (0xd4 - 0x8a) * t);
  const b = Math.round(0xdd + (0xf4 - 0xdd) * t);
  return `rgb(${r},${g},${b})`;
}

function FunctionTick({
  x,
  y,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-4}
        textAnchor="end"
        fill="var(--color-ink)"
        fontSize={10.5}
        fontFamily="var(--font-sans)"
        dy="0.4em"
      >
        {truncateLabel(payload?.value ?? "")}
      </text>
    </g>
  );
}

export default function FunctionsChart({ data }: Props) {
  const chartHeight = data.length * 22 + 60;

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Functions Under CIO Authority</h2>
        <span className="panel-sub">% of respondents with direct responsibility</span>
      </header>
      <div className="panel-body">
        {data.length === 0 ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 2, right: 44, left: 8, bottom: 2 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--color-ink-muted)",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <YAxis
                type="category"
                dataKey="function"
                width={180}
                tick={<FunctionTick />}
                tickLine={false}
                axisLine={false}
              />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]} maxBarSize={16}>
                {data.map((_, i) => (
                  <Cell key={i} fill={rankFill(i, data.length)} />
                ))}
                <LabelList
                  dataKey="pct"
                  position="right"
                  formatter={(v) => formatPercent(Number(v))}
                  style={{
                    fill: "var(--color-ink-secondary)",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
