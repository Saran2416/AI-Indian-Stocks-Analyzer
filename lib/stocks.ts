
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
}

export interface ChartData {
  date: string;
  price: number;
}

// Fetching logic moved to lib/yahoo-api.ts to prevent Next.js client-side webpack errors


export function getFallbackStockPrice(symbol: string): StockPriceData {
  const name = symbol;
  const base = 2500;
  const price = Math.max(100, base + (Math.random() - 0.5) * 400);
  const change = (Math.random() - 0.5) * 50;
  return {
    symbol: symbol.includes('.') ? symbol : `${symbol}.NS`,
    name,
    price,
    change,
    changePercent: (change / price) * 100,
    marketCap: Math.round(price * 1e8),
    volume: Math.floor(1e6 + Math.random() * 8e6),
    dayHigh: price + Math.random() * 20,
    dayLow: price - Math.random() * 20,
    fiftyTwoWeekHigh: price + Math.random() * 150,
    fiftyTwoWeekLow: price - Math.random() * 150,
    pe: 20 + Math.random() * 10,
    eps: 50 + Math.random() * 30,
    currency: 'INR',
  };
}

export function generateMockChartData(): ChartData[] {
  const data: ChartData[] = [];
  const basePrice = 2500;
  for (let i = 150; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 100;
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.max(100, basePrice + variation + (150 - i) * 2),
    });
  }
  return data;
}

export function isValidIndianStock(symbol: string): boolean {
  return symbol.toUpperCase().endsWith('.NS') || symbol.toUpperCase().endsWith('.BO');
}

export function getStockName(symbol: string): string {
  return symbol.split('.')[0].toUpperCase();
}
