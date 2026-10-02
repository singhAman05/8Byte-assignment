import type { Exchange } from "../types/type";

export const convertToText = (value: unknown): string => String(value ?? "").trim();

export const convertToNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const formulaResult = typeof value === "object" && value !== null && "result" in value ? value.result : value;
  const parsed = Number(convertToText(formulaResult).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

export const getExchangeCode = (value: unknown): Exchange => {
  const code = convertToText(value);
  return /^\d+$/.test(code) ? "BSE" : "NSE";
};

export const getSymbol = (exchangeCode: string, exchange: Exchange): string =>
  `${exchangeCode}.${exchange === "BSE" ? "BO" : "NS"}`;