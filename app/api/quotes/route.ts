import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/providers";
import { symbolsQuerySchema } from "@/config/schema";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsedSymbols = symbolsQuerySchema.safeParse(url.searchParams.get("symbols"));

  if (!parsedSymbols.success) {
    return NextResponse.json(
      { error: "Provide between 1 and 100 comma-separated symbols." },
      { status: 400 },
    );
  }

  const result = await getMarketData(parsedSymbols.data);

  return NextResponse.json({
    data: result.data,
    warnings: result.warnings,
    fetchedAt: new Date().toISOString(),
  });
}
