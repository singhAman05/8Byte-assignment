import config from "@/config/config.json";
import { getCached, setCached } from "@/lib/cache/cache";
import type { MarketDataProvider, MarketDataResult } from "./market-provider";
import { BharatStockProvider } from "./bharatstock-provider";
import { IndianStockMarketApiProvider } from "./indian-stock-market-api-provider";
import { MockMarketDataProvider } from "./mock-provider";

type ProviderConstructor = new () => MarketDataProvider;

const providerConstructors: Record<string, ProviderConstructor> = {
  BharatStockProvider,
  IndianStockMarketApiProvider,
  MockMarketDataProvider,
};

const providers: Record<string, MarketDataProvider> = {};
const providersList = config["providers-list"];
for (const providerInfo of providersList) {
  const providerClassName = Object.values(providerInfo)[0];
  const providerName = Object.keys(providerInfo)[0];
  const ProviderClass = providerConstructors[providerClassName];

  if (!ProviderClass) {
    throw new Error(`Unknown provider class configured: ${providerClassName}`);
  }

  providers[providerName] = new ProviderClass();
}

const provider = providers[config.provider.active] ?? providers.mock;
const fallbackProvider = providers[config.provider.fallback] ?? providers.mock;
const activeProviderConfig = config.marketData[config.provider.active as keyof typeof config.marketData] ?? config.marketData.mock;

const mergeResults = (primary: MarketDataResult, fallback: MarketDataResult, symbols: string[]): MarketDataResult => {
  const fallbackBySymbol = new Map(fallback.data.map((item) => [item.symbol, item]));
  const data = [...primary.data];
  const knownSymbols = new Set(data.map((item) => item.symbol));
  const warnings = [...primary.warnings];

  for (const symbol of symbols) {
    if (!knownSymbols.has(symbol)) {
      const fallbackItem = fallbackBySymbol.get(symbol);
      if (fallbackItem) {
        data.push(fallbackItem);
        warnings.push({ symbol, message: `Using mock fallback data for ${symbol}.` });
      }
    }
  }

  return { data, warnings };
};

export const getMarketData = async (symbols: string[]): Promise<MarketDataResult> => {
  const cacheKey = `market-data:${[...new Set(symbols)].sort().join(",")}`;
  const cached = getCached<MarketDataResult>(cacheKey);

  if (cached) return cached;

  let result: MarketDataResult;
  try {
    result = await provider.getMarketData(symbols);
  } catch (error) {
    if (!config.provider.fallbackOnError || provider === fallbackProvider) throw error;
    const fallback = await fallbackProvider.getMarketData(symbols);
    result = {
      ...fallback,
      warnings: [
        { message: error instanceof Error ? error.message : "Primary provider failed." },
        ...fallback.warnings,
      ],
    };
  }

  if (provider !== fallbackProvider && config.provider.fallbackOnError) {
    const fallback = await fallbackProvider.getMarketData(symbols);
    result = mergeResults(result, fallback, symbols);
  }

  setCached(cacheKey, result, activeProviderConfig.quoteCacheTtlMs);
  return result;
};

export const getMarketDataProvider = (): MarketDataProvider => provider;
