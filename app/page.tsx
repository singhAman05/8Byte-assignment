"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

import {
  InvestmentVsValueChart,
  SectorAllocationChart,
  SectorGainLossChart,
  TopHoldingsChart,
} from "@/components/charts/portfolio-charts";
import { AppHeader } from "@/components/dashboard/app-header";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { PortfolioSummaryCards } from "@/components/dashboard/portfolio-summary";
import { SectorSummaryTable } from "@/components/dashboard/sector-summary-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bone } from "@/components/ui/bone";
import { Toaster, useToasts } from "@/components/ui/toast";
import { usePortfolio } from "@/lib/hooks/use-portfolio";
import { friendlyWarnings } from "@/lib/portfolio-warnings";

export default function Home() {
  const { portfolio, error, refreshing, loadingData, refresh, retry } =
    usePortfolio();
  const { toasts, push, dismiss } = useToasts();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!portfolio) return;
    for (const warning of friendlyWarnings(portfolio)) {
      if (seenRef.current.has(warning.id)) continue;
      seenRef.current.add(warning.id);
      push(warning);
    }
  }, [portfolio, push]);

  if (error && !portfolio) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader refreshing={false} isStale={false} onRefresh={() => {}} />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md text-center" role="alert">
            <CardContent className="flex flex-col items-center gap-4 py-10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle size={24} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-lg font-semibold">Dashboard unavailable</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error ?? "No portfolio data returned."}
                </p>
              </div>
              <Button onClick={retry}>Try again</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const summary = portfolio?.summary;
  const sectors = portfolio?.sectors ?? [];
  const holdings = portfolio?.holdings ?? [];
  const largestSector = [...sectors].sort(
    (a, b) => b.totalInvestment - a.totalInvestment,
  )[0];

  return (
    <div className="flex min-h-screen flex-col bg-background" aria-busy={loadingData}>
      <AppHeader
        refreshing={refreshing}
        isStale={portfolio?.isStale ?? false}
        onRefresh={refresh}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="sr-only" role="status" aria-live="polite">
          {loadingData ? "Loading portfolio intelligence" : "Portfolio loaded"}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Portfolio overview
          </h1>
          <Bone name="overview-subtitle" loading={loadingData}>
            {portfolio && (
              <p className="text-sm text-muted-foreground">
                {holdings.length} holdings across {sectors.length} sectors ·
                auto-refreshing every 15s · last updated{" "}
                {new Date(portfolio.lastUpdated).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </Bone>
        </div>

        <Bone name="summary-metrics" loading={loadingData} className="mt-6 block">
          {portfolio && summary && (
            <PortfolioSummaryCards
              summary={summary}
              holdingsCount={holdings.length}
              largestSector={largestSector}
              isStale={portfolio.isStale}
            />
          )}
        </Bone>

        <section
          aria-label="Portfolio charts"
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <Bone name="chart-allocation" loading={loadingData} className="block">
            {portfolio && <SectorAllocationChart sectors={sectors} />}
          </Bone>
          <Bone name="chart-invested-value" loading={loadingData} className="block">
            {portfolio && <InvestmentVsValueChart sectors={sectors} />}
          </Bone>
          <Bone name="chart-gainloss" loading={loadingData} className="block">
            {portfolio && <SectorGainLossChart sectors={sectors} />}
          </Bone>
          <Bone name="chart-top-holdings" loading={loadingData} className="block">
            {portfolio && <TopHoldingsChart holdings={holdings} />}
          </Bone>
        </section>

        <Bone name="sector-summary" loading={loadingData} className="mt-6 block">
          {portfolio && (
            <section>
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle id="sector-summary-heading">Sector summary</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Investment, present value &amp; gain/loss by sector
                      </p>
                    </div>
                    <Badge variant="muted">{sectors.length} sectors</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <SectorSummaryTable sectors={sectors} />
                </CardContent>
              </Card>
            </section>
          )}
        </Bone>

        <Bone name="holdings-table" loading={loadingData} className="mt-6 block">
          {portfolio && (
            <section>
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle id="holdings-heading">All holdings</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        INR · {holdings.length} positions
                      </p>
                    </div>
                    <Badge variant="muted">{sectors.length} sectors</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <HoldingsTable holdings={holdings} />
                </CardContent>
              </Card>
            </section>
          )}
        </Bone>

        <footer className="mt-8 flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>Informational dashboard · Not investment advice</span>
          <span>Source: provider latest available data</span>
        </footer>
      </main>

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
