"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IndustryStat, formatCurrency } from "@/lib/dataUtils";

interface Props {
  data: IndustryStat[];
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  index?: number;
  [key: string]: unknown;
}

function rightRoundedPath(x: number, y: number, w: number, h: number, r: number): string {
  const rx = Math.min(r, w / 2, h / 2);
  return [
    `M ${x},${y}`,
    `L ${x + w - rx},${y}`,
    `Q ${x + w},${y} ${x + w},${y + rx}`,
    `L ${x + w},${y + h - rx}`,
    `Q ${x + w},${y + h} ${x + w - rx},${y + h}`,
    `L ${x},${y + h}`,
    `Z`,
  ].join(" ");
}

function rankColor(index: number, total: number): string {
  const t = total <= 1 ? 0 : index / (total - 1);
  const r = Math.round(0x18 + (0xb5 - 0x18) * t);
  const g = Math.round(0x5f + (0xd4 - 0x5f) * t);
  const b = Math.round(0xa5 + (0xf4 - 0xa5) * t);
  return `rgb(${r},${g},${b})`;
}

function IndustryBar({ x = 0, y = 0, width = 0, height = 0, fill, index }: BarShapeProps) {
  if (width <= 0 || height <= 0) return null;
  return (
    <g>
      <path d={rightRoundedPath(x, y, width, height, 3)} fill={fill} />
      {index === 0 && (
        <rect x={x} y={y} width={3} height={height} fill="var(--color-champagne)" />
      )}
    </g>
  );
}

function IndustryTick({
  x,
  y,
  payload,
  data,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  data: IndustryStat[];
}) {
  const entry = data.find((d) => d.industry === payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-4}
        textAnchor="end"
        fill="var(--color-ink)"
        fontSize={11}
        fontFamily="var(--font-sans)"
        dy="-3"
      >
        {payload?.value}
      </text>
      {entry && (
        <text
          x={-4}
          textAnchor="end"
          fill="var(--color-ink-muted)"
          fontSize={10}
          fontFamily="var(--font-sans)"
          dy="9"
        >
          {`n=${entry.n}`}
        </text>
      )}
    </g>
  );
}

function IndustryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: IndustryStat }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "0.5px solid var(--color-border)",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          color: "var(--color-ink)",
          marginBottom: 4,
        }}
      >
        {d.industry}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--color-blue)",
          fontSize: 13,
        }}
      >
        {formatCurrency(d.median)}
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          color: "var(--color-ink-muted)",
          fontSize: 11,
          marginTop: 2,
        }}
      >
        n={d.n} respondents
      </div>
    </div>
  );
}

export default function CompByIndustryChart({ data }: Props) {
  const qualified = data.filter((d) => d.n >= 3);
  const showFootnote = qualified.length < 3;
  const displayData = showFootnote ? data : qualified;
  const chartHeight = Math.min(displayData.length * 32 + 60, 280);

  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="panel-title">Compensation by Industry</h2>
        <span className="panel-sub">Median · USD</span>
      </header>
      <div className="panel-body">
        {data.length === 0 ? (
          <div className="panel-empty">No data for current filters</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={displayData}
                layout="vertical"
                margin={{ top: 2, right: 60, left: 8, bottom: 2 }}
              >
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="industry"
                  width={130}
                  tick={<IndustryTick data={displayData} />}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<IndustryTooltip />}
                  cursor={{ fill: "var(--color-surface)" }}
                />
                <Bar dataKey="median" maxBarSize={20} shape={<IndustryBar />}>
                  {displayData.map((_, i) => (
                    <Cell key={i} fill={rankColor(i, displayData.length)} />
                  ))}
                  <LabelList
                    dataKey="median"
                    position="right"
                    formatter={(v) => formatCurrency(Number(v))}
                    style={{
                      fill: "var(--color-ink)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {showFootnote && (
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 10,
                  color: "var(--color-ink-muted)",
                  marginTop: 6,
                }}
              >
                * Industries with fewer than 3 responses shown for reference only
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
