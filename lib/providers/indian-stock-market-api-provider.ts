import config from "../../config/config.json";
import type { MarketData } from "../../types/type";
import type { MarketDataProvider, MarketDataResult } from "./market-provider";

type ApiStock = {
  symbol?: string;
  ticker?: string;
  last_price?: unknown;
  pe_ratio?: unknown;
  eps?: unknown;
};

type ApiResponse = {
  stocks?: ApiStock[];
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && "value" in value) {
    return asNumber(value.value);
  }
  return null;
};

const normalizeSymbol = (value: string): string => value.toUpperCase().trim();

export class IndianStockMarketApiProvider implements MarketDataProvider {
  private readonly providerConfig = config.marketData["indian-stock-api"];

  async getMarketData(symbols: string[]): Promise<MarketDataResult> {
    const requestedSymbols = [...new Set(symbols.map(normalizeSymbol))];
    const vendorSymbols = requestedSymbols.map(
      (symbol) => config.symbolMappings[symbol as keyof typeof config.symbolMappings] ?? symbol,
    );
    const url = new URL(this.providerConfig.quotePath, this.providerConfig.baseUrl);
    url.searchParams.set("symbols", vendorSymbols.join(","));
    url.searchParams.set("res", "num");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.providerConfig.timeoutMs),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Indian Stock Market API returned HTTP ${response.status}.`);
    }

    const payload = await response.json() as ApiResponse;
    const responseBySymbol = new Map(
      (payload.stocks ?? []).map((item) => [normalizeSymbol(item.ticker ?? item.symbol ?? ""), item]),
    );
    const fetchedAt = new Date().toISOString();
    const data: MarketData[] = [];
    const warnings = [];

    for (const requestedSymbol of requestedSymbols) {
      const vendorSymbol = normalizeSymbol(
        config.symbolMappings[requestedSymbol as keyof typeof config.symbolMappings] ?? requestedSymbol,
      );
      const item = responseBySymbol.get(vendorSymbol) ?? responseBySymbol.get(vendorSymbol.replace(/\.(NS|BO)$/, ""));
      if (!item) {
        warnings.push({ symbol: requestedSymbol, message: `No provider data found for ${requestedSymbol}.` });
        continue;
      }
      data.push({
        symbol: requestedSymbol,
        cmp: asNumber(item.last_price),
        peRatio: asNumber(item.pe_ratio),
        latestEarnings: asNumber(item.eps),
        currency: "INR",
        source: "Indian Stock Market API (Yahoo Finance)",
        fetchedAt,
      });
    }

    return { data, warnings };
  }
}