import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HoldingMetrics } from "@/types/type";

function GainLoss({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">N/A</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-end gap-1 font-medium tabular-nums whitespace-nowrap",
        value >= 0 ? "text-success" : "text-destructive",
      )}
    >
      {value >= 0 ? (
        <ArrowUpRight size={14} aria-hidden="true" className="shrink-0" />
      ) : (
        <ArrowDownRight size={14} aria-hidden="true" className="shrink-0" />
      )}
      {money(value)}
    </span>
  );
}

export function HoldingsTable({ holdings }: { holdings: HoldingMetrics[] }) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[1280px] border-collapse text-sm"
        aria-labelledby="holdings-heading"
      >
        <caption className="sr-only">
          Portfolio holdings with investment, allocation, present value, and gain
          or loss.
        </caption>
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-6 py-3 text-left font-medium">
              Holding
            </th>
            <th scope="col" className="px-6 py-3 text-left font-medium">
              Exchange
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Buy price
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Qty
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Investment
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Weight
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              CMP
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Present value
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Gain / loss
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              P/E
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Latest EPS
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((item) => {
            const { holding } = item;
            return (
              <tr
                key={holding.id}
                className="border-b transition-colors last:border-0 hover:bg-muted/50"
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{holding.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {holding.symbol}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    className={cn(
                      "border-transparent font-medium",
                      holding.exchange === "NSE"
                        ? "bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-500"
                        : "bg-yellow-400 text-yellow-950 hover:bg-yellow-400 dark:bg-yellow-400 dark:text-yellow-950",
                    )}
                  >
                    {holding.exchange}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                  {money(holding.purchasePrice)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                  {holding.quantity}
                </td>
                <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                  {money(item.investment)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.portfolioPercentage.toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                  {money(item.cmp)}
                </td>
                <td className="px-6 py-4 text-right font-medium tabular-nums whitespace-nowrap">
                  {money(item.presentValue)}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <GainLoss value={item.gainLoss} />
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.peRatio === null ? "N/A" : item.peRatio.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-muted-foreground whitespace-nowrap">
                  {item.latestEarnings === null
                    ? "N/A"
                    : item.latestEarnings.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
