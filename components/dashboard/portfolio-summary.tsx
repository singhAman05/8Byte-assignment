"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { MetricCard } from "@/components/dashboard/metric-card";
import { money, percent } from "@/lib/format";
import type { PortfolioSummary, SectorSummary } from "@/types/type";

export function PortfolioSummaryCards({
  summary,
  holdingsCount,
  largestSector,
  isStale,
}: {
  summary: PortfolioSummary;
  holdingsCount: number;
  largestSector?: SectorSummary;
  isStale: boolean;
}) {
  const gainPositive = (summary.totalGainLoss ?? 0) >= 0;

  return (
    <section
      aria-label="Portfolio summary"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      <MetricCard
        label="Total invested"
        value={<AnimatedNumber value={summary.totalInvestment} format={money} />}
        detail={`${holdingsCount} positions`}
        icon={<Wallet size={16} aria-hidden="true" />}
      />
      <MetricCard
        label="Present value"
        value={<AnimatedNumber value={summary.totalPresentValue} format={money} />}
        detail={isStale ? "Cached observation" : "Latest price"}
      />
      <MetricCard
        label="Total gain / loss"
        value={<AnimatedNumber value={summary.totalGainLoss} format={money} />}
        detail={percent(summary.returnPercentage)}
        tone={gainPositive ? "positive" : "negative"}
        icon={
          gainPositive ? (
            <TrendingUp size={16} aria-hidden="true" />
          ) : (
            <TrendingDown size={16} aria-hidden="true" />
          )
        }
      />
      <MetricCard
        label="Largest sector"
        value={largestSector?.sector ?? "N/A"}
        detail={largestSector ? money(largestSector.totalInvestment) : undefined}
      />
    </section>
  );
}
