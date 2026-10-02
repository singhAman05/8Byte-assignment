import type { PortfolioResponse } from "@/types/type";

export type FriendlyWarning = {
  id: string;
  title: string;
  description: string;
};

/**
 * Turns raw provider warnings into user-friendly toasts keyed by company name.
 * Multiple raw warnings for the same symbol collapse into a single toast so the
 * user sees one note per affected holding instead of HTTP codes or symbols.
 */
export function friendlyWarnings(portfolio: PortfolioResponse): FriendlyWarning[] {
  const nameBySymbol = new Map<string, string>();
  for (const item of portfolio.holdings) {
    nameBySymbol.set(item.holding.symbol, item.holding.name);
  }

  const bySymbol = new Map<string, FriendlyWarning>();
  const generic = new Map<string, FriendlyWarning>();

  for (const warning of portfolio.warnings) {
    if (warning.symbol) {
      const id = `sym:${warning.symbol}`;
      if (bySymbol.has(id)) continue;
      const companyName = nameBySymbol.get(warning.symbol) ?? warning.symbol;
      bySymbol.set(id, {
        id,
        title: companyName,
        description: "Live quote unavailable — showing last known price.",
      });
    } else {
      // Provider-level failures (timeouts, HTTP 429, etc.) collapse into one
      // friendly note — users shouldn't see raw status codes or error text.
      const id = "provider";
      if (generic.has(id)) continue;
      generic.set(id, {
        id,
        title: "Market data delayed",
        description: "Live prices are temporarily unavailable — showing last known values.",
      });
    }
  }

  return [...bySymbol.values(), ...generic.values()];
}
