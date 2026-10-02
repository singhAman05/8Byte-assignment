import config from "../../config/config.json";
import { getCached, setCached } from "../cache/cache";
import type { MarketData } from "../../types/type";
import type { MarketDataProvider, MarketDataResult } from "./market-provider";

type BharatStockRow = Record<string, unknown>;

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

const text = (value: unknown): string | null => (typeof value === "string" ? value : null);

const symbolMappings = config.symbolMappings as Record<string, string>;

const symbolWithoutExchange = (symbol: string): string => symbol.replace(/\.(NS|BO)$/i, "").toUpperCase();

/** Map a holding symbol (e.g. a numeric BSE code) to a BharatStock ticker, then strip the exchange suffix. */
const toApiSymbol = (symbol: string): string => symbolWithoutExchange(symbolMappings[symbol] ?? symbol);

const getField = (row: BharatStockRow, ...names: string[]): unknown => {
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }
  return null;
};

const responseRows = (payload: unknown): BharatStockRow[] => {
  if (Array.isArray(payload)) return payload.filter((row): row is BharatStockRow => Boolean(row && typeof row === "object"));
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data.filter((row): row is BharatStockRow => Boolean(row && typeof row === "object"));
  }
  return [];
};

export class BharatStockProvider implements MarketDataProvider {
  private readonly apiKey = process.env.BHARATSTOCK_API_KEY;
  private readonly providerConfig = config.marketData.bharatstock;

  private async request(path: string, query?: Record<string, string>): Promise<unknown> {
    if (!this.apiKey) throw new Error("BHARATSTOCK_API_KEY is not configured.");

    const url = new URL(path, this.providerConfig.baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(this.providerConfig.timeoutMs),
      headers: { Accept: "application/json", "X-API-Key": this.apiKey },
    });

    if (!response.ok) throw new Error(`BharatStock API returned HTTP ${response.status}.`);
    return response.json();
  }

  /** Per-ticker fundamentals (P/E, EPS) live on a separate endpoint; cached with the long fundamentals TTL. */
  private async fetchRatios(apiSymbol: string): Promise<{ peRatio: number | null; latestEarnings: number | null }> {
    const fundamentalsPath = this.providerConfig.fundamentalsPath;
    if (!fundamentalsPath) return { peRatio: null, latestEarnings: null };

    const cacheKey = `bharatstock:ratios:${apiSymbol}`;
    const cached = getCached<{ peRatio: number | null; latestEarnings: number | null }>(cacheKey);
    if (cached) return cached;

    try {
      const path = fundamentalsPath.replace("{symbol}", encodeURIComponent(apiSymbol));
      const payload = await this.request(path);
      const row = payload && typeof payload === "object" ? (payload as BharatStockRow) : {};
      const ratios = {
        peRatio: asNumber(getField(row, "pe_ratio", "pe")),
        latestEarnings: asNumber(getField(row, "eps", "latest_eps", "trailing_eps")),
      };
      setCached(cacheKey, ratios, this.providerConfig.fundamentalsCacheTtlMs);
      return ratios;
    } catch {
      return { peRatio: null, latestEarnings: null };
    }
  }

  async getMarketData(symbols: string[]): Promise<MarketDataResult> {
    const requestedSymbols = [...new Set(symbols.map((symbol) => symbol.toUpperCase().trim()))];
    const apiSymbols = requestedSymbols.map((symbol) => toApiSymbol(symbol));
    const payload = await this.request(this.providerConfig.quotePath, {
      symbols: apiSymbols.join(","),
    });
    const rows = responseRows(payload);
    const rowsBySymbol = new Map(rows.map((row) => [text(getField(row, "symbol", "ticker"))?.toUpperCase(), row]));
    const fetchedAt = new Date().toISOString();
    const data: MarketData[] = [];
    const warnings = [];

    const found: Array<{ requestedSymbol: string; apiSymbol: string; row: BharatStockRow }> = [];
    for (const requestedSymbol of requestedSymbols) {
      const apiSymbol = toApiSymbol(requestedSymbol);
      const row = rowsBySymbol.get(apiSymbol);
      if (!row || getField(row, "found") === false) {
        warnings.push({ symbol: requestedSymbol, message: `No BharatStock quote found for ${requestedSymbol}.` });
        continue;
      }
      found.push({ requestedSymbol, apiSymbol, row });
    }

    const ratios = await Promise.all(found.map((entry) => this.fetchRatios(entry.apiSymbol)));

    found.forEach(({ requestedSymbol, row }, index) => {
      const ratio = ratios[index];
      data.push({
        symbol: requestedSymbol,
        cmp: asNumber(getField(row, "latest_price", "last_price", "close", "price")),
        peRatio: ratio.peRatio,
        latestEarnings: ratio.latestEarnings,
        currency: "INR",
        source: "BharatStock API",
        fetchedAt,
      });
    });

    return { data, warnings };
  }
}