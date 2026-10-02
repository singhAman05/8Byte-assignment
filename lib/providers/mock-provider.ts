import snapshot from "../../data/mock-market-data.json";
import type { MarketData } from "../../types/type";
import type { MarketDataProvider, MarketDataResult } from "./market-provider";

const marketData = snapshot as MarketData[];

export class MockMarketDataProvider implements MarketDataProvider {
  async getMarketData(symbols: string[]): Promise<MarketDataResult> {
    const requestedSymbols = new Set(symbols);
    const data = marketData.filter((item) => requestedSymbols.has(item.symbol));
    const knownSymbols = new Set(data.map((item) => item.symbol));
    const warnings = symbols
      .filter((symbol) => !knownSymbols.has(symbol))
      .map((symbol) => ({ symbol, message: `No market data found for ${symbol}.` }));

    return { data, warnings };
  }
}
