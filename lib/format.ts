const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const money = (value: number | null): string =>
  value === null ? "N/A" : inr.format(value);

export const percent = (value: number | null): string =>
  value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
