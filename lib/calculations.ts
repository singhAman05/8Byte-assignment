import type { Holding, MockMarketData, HoldingMetrics, CalculatedPortfolio } from "../types/type";

function sumKnownValues(values: Array<number | null>): number | null {
  const knownValues = values.filter((value): value is number => value !== null);
  return knownValues.length > 0 ? knownValues.reduce((sum, value) => sum + value, 0) : null;
}

function calculateInvestment(holding: Holding): number {
  return holding.purchasePrice * holding.quantity;
}

function calculateHoldingMetrics(holding: Holding, marketData: MockMarketData | undefined, totalInvestment: number): HoldingMetrics {
  const investment = calculateInvestment(holding);
  const cmp = marketData?.cmp ?? null;
  const presentValue = cmp === null ? null : cmp * holding.quantity;
  const gainLoss = presentValue === null ? null : presentValue - investment;

  return {
    holding,
    investment,
    portfolioPercentage: totalInvestment === 0 ? 0 : (investment / totalInvestment) * 100,
    cmp,
    peRatio: marketData?.peRatio ?? null,
    latestEarnings: marketData?.latestEarnings ?? null,
    presentValue,
    gainLoss,
  };
};

function calculateSectors(sector: string, items: HoldingMetrics[]){
    const sectorInvestment = items.reduce((sum, item) => sum + item.investment, 0);
    const sectorPresentValue = sumKnownValues(items.map((item) => item.presentValue));

    return {
      sector,
      holdingCount: items.length,
      totalInvestment: sectorInvestment,
      totalPresentValue: sectorPresentValue,
      gainLoss: sectorPresentValue === null ? null : sectorPresentValue - sectorInvestment,
    };
}

export const calculatePortfolio = (holdings: Holding[], marketData: MockMarketData[]): CalculatedPortfolio => {
  const marketDataBySymbol = new Map(marketData.map((item) => [item.symbol, item]));
  const totalInvestment = holdings.reduce((sum, holding) => sum + calculateInvestment(holding), 0);

  const calculatedHoldings = holdings.map((holding) =>
    calculateHoldingMetrics(holding, marketDataBySymbol.get(holding.symbol), totalInvestment),
  );

  const totalPresentValue = sumKnownValues(calculatedHoldings.map((item) => item.presentValue));
  const totalGainLoss = totalPresentValue === null ? null : totalPresentValue - totalInvestment;

  const sectorMap = new Map<string, HoldingMetrics[]>();
  for (const item of calculatedHoldings) {
    const items = sectorMap.get(item.holding.sector) ?? [];
    items.push(item);
    sectorMap.set(item.holding.sector, items);
  }

  const sectors = Array.from(sectorMap.entries()).map(([sector, items]) => calculateSectors(sector, items));

  return {
    holdings: calculatedHoldings,
    summary: {
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      returnPercentage: totalGainLoss === null || totalInvestment === 0 ? null : (totalGainLoss / totalInvestment) * 100,
    },
    sectors,
  };
};
