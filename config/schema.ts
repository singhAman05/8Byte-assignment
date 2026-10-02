import { z } from "zod";

export const symbolsQuerySchema = z
  .string()
  .transform((value) => [...new Set(value.split(",").map((symbol) => symbol.trim()).filter(Boolean))])
  .pipe(z.array(z.string().min(1).max(32)).min(1).max(100));

export const quoteSchema = z.object({
  symbol: z.string(),
  cmp: z.number().nullable(),
  peRatio: z.number().nullable(),
  latestEarnings: z.number().nullable(),
  currency: z.literal("INR"),
  source: z.string(),
  fetchedAt: z.string(),
});

export const holdingsSchema = z.array(
  z.object({
    id: z.string(),
    sourceRow: z.number().int(),
    name: z.string().min(1),
    symbol: z.string().min(1),
    exchangeCode: z.string().min(1),
    exchange: z.enum(["NSE", "BSE"]),
    sector: z.string().min(1),
    purchasePrice: z.number().nonnegative(),
    quantity: z.number().positive(),
  }),
);
