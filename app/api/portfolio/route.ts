import holdingsData from "@/data/holdings.json";
import { calculatePortfolio } from "@/lib/calculations";
import { getMarketData } from "@/lib/providers";
import { holdingsSchema } from "@/config/schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const parsedHoldings = holdingsSchema.safeParse(holdingsData);

  if (!parsedHoldings.success) {
    return NextResponse.json(
      { error: "Portfolio holdings failed validation." },
      { status: 500 },
    );
  }

  const symbols = parsedHoldings.data.map((holding) => holding.symbol);
  const marketResult = await getMarketData(symbols);
  const portfolio = calculatePortfolio(parsedHoldings.data, marketResult.data);

  return NextResponse.json({
    ...portfolio,
    marketData: marketResult.data,
    lastUpdated: new Date().toISOString(),
    isStale: false,
    warnings: marketResult.warnings,
  });
}
