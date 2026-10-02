"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { HoldingMetrics, SectorSummary } from "@/types/type";

/** Animate charts on first mount only, so 15s data refreshes update in place without re-growing. */
function useAnimateOnce(ms = 800) {
  const [animate, setAnimate] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(false), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return animate;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const inrFull = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function inrCompact(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${abs}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  );
}

type TooltipRow = { label: string; value: string; color?: string };

function ChartTooltip({
  title,
  rows,
}: {
  title: string;
  rows: TooltipRow[];
}) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-xs font-medium">{title}</p>
      {rows.map((row) => (
        <p
          key={row.label}
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          {row.color && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: row.color }}
            />
          )}
          <span>{row.label}</span>
          <span className="ml-auto font-medium text-foreground">
            {row.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

/** Donut: sector allocation weighted by invested capital. */
export function SectorAllocationChart({
  sectors,
}: {
  sectors: SectorSummary[];
}) {
  const total = sectors.reduce((sum, s) => sum + s.totalInvestment, 0);
  const data = sectors
    .filter((s) => s.totalInvestment > 0)
    .map((s) => ({ name: s.sector, value: s.totalInvestment }))
    .sort((a, b) => b.value - a.value);
  const animate = useAnimateOnce();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector allocation</CardTitle>
        <CardDescription>Share of invested capital by sector</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No allocation data available." />
        ) : (
          <figure
            aria-label="Donut chart of portfolio allocation by sector"
            className="h-[260px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={animate}
                  animationDuration={700}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value}
                    </span>
                  )}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const value = Number(item.value ?? 0);
                    const share = total ? (value / total) * 100 : 0;
                    return (
                      <ChartTooltip
                        title={String(item.name)}
                        rows={[
                          { label: "Invested", value: inrFull.format(value) },
                          { label: "Weight", value: `${share.toFixed(1)}%` },
                        ]}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

/** Vertical bars: gain/loss by sector, colored by sign. */
export function SectorGainLossChart({
  sectors,
}: {
  sectors: SectorSummary[];
}) {
  const data = sectors
    .filter((s) => s.gainLoss !== null)
    .map((s) => ({ name: s.sector, gainLoss: s.gainLoss as number }));
  const animate = useAnimateOnce();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gain / loss by sector</CardTitle>
        <CardDescription>Unrealised performance per sector</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="Price coverage incomplete for performance." />
        ) : (
          <figure
            aria-label="Bar chart of gain or loss by sector"
            className="h-[260px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={inrCompact}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const value = Number(payload[0].value ?? 0);
                    return (
                      <ChartTooltip
                        title={String(label)}
                        rows={[
                          {
                            label: value >= 0 ? "Gain" : "Loss",
                            value: inrFull.format(value),
                          },
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="gainLoss" radius={[4, 4, 0, 0]} isAnimationActive={animate} animationDuration={700}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.gainLoss >= 0 ? "var(--success)" : "var(--destructive)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

/** Horizontal bars: largest holdings by invested value. */
export function TopHoldingsChart({
  holdings,
}: {
  holdings: HoldingMetrics[];
}) {
  const data = [...holdings]
    .sort((a, b) => b.investment - a.investment)
    .slice(0, 7)
    .map((item) => ({
      name: item.holding.name,
      investment: item.investment,
    }))
    .reverse();
  const animate = useAnimateOnce();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top holdings</CardTitle>
        <CardDescription>Largest positions by invested capital</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No holdings to display." />
        ) : (
          <figure
            aria-label="Horizontal bar chart of top holdings by investment"
            className="h-[260px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data}
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={inrCompact}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <ChartTooltip
                        title={String(label)}
                        rows={[
                          {
                            label: "Invested",
                            value: inrFull.format(Number(payload[0].value ?? 0)),
                          },
                        ]}
                      />
                    );
                  }}
                />
                <Bar
                  dataKey="investment"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}

/** Grouped bars: invested vs present value per sector. */
export function InvestmentVsValueChart({
  sectors,
}: {
  sectors: SectorSummary[];
}) {
  const data = sectors.map((s) => ({
    name: s.sector,
    investment: s.totalInvestment,
    presentValue: s.totalPresentValue ?? 0,
  }));
  const animate = useAnimateOnce();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invested vs present value</CardTitle>
        <CardDescription>Cost basis compared to current value</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState message="No sector data available." />
        ) : (
          <figure
            aria-label="Grouped bar chart comparing invested capital with present value by sector"
            className="h-[260px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="name"
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={inrCompact}
                  width={64}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <ChartTooltip
                        title={String(label)}
                        rows={payload.map((entry) => ({
                          label:
                            entry.dataKey === "investment"
                              ? "Invested"
                              : "Present value",
                          value: inrFull.format(Number(entry.value ?? 0)),
                          color: String(entry.color),
                        }))}
                      />
                    );
                  }}
                />
                <Legend
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">
                      {value === "investment" ? "Invested" : "Present value"}
                    </span>
                  )}
                />
                <Bar
                  dataKey="investment"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
                <Bar
                  dataKey="presentValue"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={animate}
                  animationDuration={700}
                />
              </BarChart>
            </ResponsiveContainer>
          </figure>
        )}
      </CardContent>
    </Card>
  );
}
