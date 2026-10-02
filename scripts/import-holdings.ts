import ExcelJS from "exceljs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Holding, MockMarketData } from "../types/type";
import { convertToText, convertToNumber, getExchangeCode, getSymbol } from "./utils";

function createId(name: string, sourceRow: number): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${sourceRow}`;
}

async function main(): Promise<void> {
  const inputPath = process.argv[2] ?? "F9001561_ADDBA737E8_B72562937A.xlsx";
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);

  if (workbook.worksheets.length === 0) {
    throw new Error("The workbook does not contain any worksheets.");
  }

  const worksheet = workbook.worksheets[0];
  const holdings: Holding[] = [];
  const marketData: MockMarketData[] = [];
  const errors: string[] = [];
  let currentSector: string | null = null;

  worksheet.eachRow((row, rowNumber) => {
  const values = row.values as unknown[];
  const rowNumberValue = values[1];
  const name = convertToText(values[2]);

  if (/sector$/i.test(name)) {
    currentSector = name;
    return;
  }

  if (!Number.isInteger(rowNumberValue) || !name) {
    return;
  }

  const purchasePrice = convertToNumber(values[3]);
  const quantity = convertToNumber(values[4]);
  const exchangeCode = convertToText(values[7]);
  const sector = currentSector ?? "Other";

  if (purchasePrice === null || purchasePrice < 0) {
    errors.push(`Row ${rowNumber}: Purchase Price must be a non-negative number.`);
  }

  if (quantity === null || quantity <= 0) {
    errors.push(`Row ${rowNumber}: Qty must be greater than zero.`);
  }

  if (!exchangeCode) {
    errors.push(`Row ${rowNumber}: NSE/BSE code is required.`);
  }

  if (purchasePrice === null || quantity === null || !exchangeCode) {
    return;
  }

  const exchange = getExchangeCode(exchangeCode);
  const symbol = getSymbol(exchangeCode, exchange);

  holdings.push({
    id: createId(name, rowNumber),
    sourceRow: rowNumber,
    name,
    symbol,
    exchangeCode,
    exchange,
    sector,
    purchasePrice,
    quantity,
  });

  marketData.push({
    symbol,
    cmp: convertToNumber(values[8]),
    peRatio: convertToNumber(values[13]),
    latestEarnings: convertToNumber(values[14]),
    currency: "INR",
    source: "workbook snapshot",
    fetchedAt: new Date().toISOString(),
  });
  });

  const symbols = new Set<string>();
  for (const holding of holdings) {
    if (symbols.has(holding.symbol)) {
      errors.push(`Row ${holding.sourceRow}: Duplicate symbol ${holding.symbol}.`);
    }
    symbols.add(holding.symbol);
  }

  if (errors.length > 0) {
    throw new Error(`Workbook validation failed:\n${errors.join("\n")}`);
  }

  if (holdings.length === 0) {
    throw new Error("Workbook validation failed: no holdings were found.");
  }

  const outputDirectory = path.resolve("data");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "holdings.json"), `${JSON.stringify(holdings, null, 2)}\n`);
  await writeFile(path.join(outputDirectory, "mock-market-data.json"), `${JSON.stringify(marketData, null, 2)}\n`);

  console.log(`Imported ${holdings.length} holdings from ${worksheet.name}.`);
  console.log(`Wrote ${path.join(outputDirectory, "holdings.json")}.`);
  console.log(`Wrote ${path.join(outputDirectory, "mock-market-data.json")}.`);
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
