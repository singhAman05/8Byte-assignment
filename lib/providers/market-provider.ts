import type { MarketData } from "../../types/type";

export type ProviderWarning = {
  symbol?: string;
  message: string;
};

export type MarketDataResult = {
  data: MarketData[];
  warnings: ProviderWarning[];
};

export interface MarketDataProvider {
  getMarketData(symbols: string[]): Promise<MarketDataResult>;
}
