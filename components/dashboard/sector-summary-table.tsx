import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SectorSummary } from "@/types/type";

export function SectorSummaryTable({ sectors }: { sectors: SectorSummary[] }) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full min-w-[640px] border-collapse text-sm"
        aria-labelledby="sector-summary-heading"
      >
        <caption className="sr-only">
          Sector-level totals for investment, present value, and gain or loss.
        </caption>
        <thead>
          <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-6 py-3 text-left font-medium">
              Sector
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Holdings
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Investment
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Present value
            </th>
            <th scope="col" className="px-6 py-3 text-right font-medium">
              Gain / loss
            </th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((sector) => (
            <tr
              key={sector.sector}
              className="border-b transition-colors last:border-0 hover:bg-muted/50"
            >
              <td className="px-6 py-4 font-medium text-foreground">
                {sector.sector}
              </td>
              <td className="px-6 py-4 text-right tabular-nums text-muted-foreground">
                {sector.holdingCount}
              </td>
              <td className="px-6 py-4 text-right tabular-nums">
                {money(sector.totalInvestment)}
              </td>
              <td className="px-6 py-4 text-right font-medium tabular-nums">
                {money(sector.totalPresentValue)}
              </td>
              <td className="px-6 py-4 text-right">
                {sector.gainLoss === null ? (
                  <span className="text-muted-foreground">N/A</span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center justify-end gap-1 font-medium tabular-nums whitespace-nowrap",
                      sector.gainLoss >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {sector.gainLoss >= 0 ? (
                      <ArrowUpRight size={14} aria-hidden="true" className="shrink-0" />
                    ) : (
                      <ArrowDownRight size={14} aria-hidden="true" className="shrink-0" />
                    )}
                    {money(sector.gainLoss)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
