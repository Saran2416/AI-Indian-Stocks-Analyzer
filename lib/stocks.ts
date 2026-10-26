
export interface StockPriceData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  pe: number;
  eps: number;
  currency: string;
  /** Timestamp of the live quote (ISO 8601). */
  dataAsOf: string;
}

export interface ChartData {
  /** ISO timestamp for the bar (rendered in IST by the chart). */
  date: string;
  /** Close price. Kept as `price` for backwards compatibility with the AI analysis code. */
  price: number;
  /** Milliseconds since epoch (used for live updates and detailed tooltips). */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * A lightweight second-by-second quote update. It intentionally omits fields
 * that change slowly (market cap, P/E, EPS) so the client can merge it into an
 * existing full quote without overwriting them with zeros.
 */
export interface LiveQuoteUpdate {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currency: string;
  dataAsOf: string;
  marketState: string;
}

export interface LiveMarketData {
  source: string;
  exchange: string;
  marketState: string;
  generatedAt: string;
  asOf: string;
  asOfIST: string;
  count: number;
  quotes: StockPriceData[];
}

// Fetching logic moved to lib/yahoo-api.ts to prevent Next.js client-side webpack errors

export function isValidIndianStock(symbol: string): boolean {
  return symbol.toUpperCase().endsWith('.NS') || symbol.toUpperCase().endsWith('.BO');
}

export function getStockName(symbol: string): string {
  return symbol.split('.')[0].toUpperCase();
}
