export const exchanges = ["NSE", "BSE"] as const;
export const currencies = ["INR"] as const;
export type Exchange = (typeof exchanges)[number];
export type Currency = (typeof currencies)[number];

export type Holding = {
  id: string;
  sourceRow: number;
  name: string;
  symbol: string;
  exchangeCode: string;
  exchange: Exchange;
  sector: string;
  purchasePrice: number;
  quantity: number;
};

export type MarketData = {
  symbol: string;
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  currency: Currency;
  source: string;
  fetchedAt: string;
};

export type MockMarketData = MarketData;

export type HoldingMetrics = {
  holding: Holding;
  investment: number;
  portfolioPercentage: number;
  cmp: number | null;
  peRatio: number | null;
  latestEarnings: number | null;
  presentValue: number | null;
  gainLoss: number | null;
};

export type PortfolioSummary = {
  totalInvestment: number;
  totalPresentValue: number | null;
  totalGainLoss: number | null;
  returnPercentage: number | null;
};

export type SectorSummary = {
  sector: string;
  holdingCount: number;
  totalInvestment: number;
  totalPresentValue: number | null;
  gainLoss: number | null;
};

export type CalculatedPortfolio = {
  holdings: HoldingMetrics[];
  summary: PortfolioSummary;
  sectors: SectorSummary[];
};

export type MarketDataWarning = { symbol?: string; message: string };

export type PortfolioResponse = CalculatedPortfolio & {
  marketData: MarketData[];
  lastUpdated: string;
  isStale: boolean;
  warnings: MarketDataWarning[];
};

export type CacheEntry<Value> = {
  value: Value;
  expiresAt: number;
};