import { StockPriceData, ChartData, getStockName, getFallbackStockPrice, generateMockChartData } from './stocks';

// Helper to scrape Google Finance for Market Cap and PE
async function getGoogleFinanceData(symbol: string): Promise<{ pe: number; marketCap: number }> {
  try {
    const gfSymbol = symbol.toUpperCase().replace('.NS', ':NSE').replace('.BO', ':BOM');
    const res = await fetch(`https://www.google.com/finance/quote/${gfSymbol}?hl=en`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
      cache: 'no-store'
    });
    
    if (!res.ok) return { pe: 0, marketCap: 0 };
    
    const html = await res.text();
    let pe = 0;
    let marketCap = 0;
    
    // Robust indexOf parsing
    const peI = html.indexOf('P/E ratio</div>');
    if (peI !== -1) {
      const clsI = html.indexOf('class="P6K39c"', peI);
      const startI = html.indexOf('>', clsI) + 1;
      const endI = html.indexOf('</div>', startI);
      const valText = html.slice(startI, endI).trim().replace(/,/g, '');
      pe = parseFloat(valText) || 0;
    }

    const mcI = html.indexOf('Market cap</div>');
    if (mcI !== -1) {
      const clsI = html.indexOf('class="P6K39c"', mcI);
      const startI = html.indexOf('>', clsI) + 1;
      const endI = html.indexOf('</div>', startI);
      const valText = html.slice(startI, endI).trim();
      const match = valText.match(/([\d\.]+)(T|B|M|K|Cr|Lakh)?/);
      if (match) {
         let num = parseFloat(match[1]);
         const suffix = match[2] || (valText.includes('T INR') || valText.includes('TCAD') ? 'T' : '');
         if (suffix === 'T') num *= 1e12;
         if (suffix === 'B') num *= 1e9;
         if (suffix === 'M') num *= 1e6;
         if (suffix === 'K') num *= 1e3;
         if (suffix === 'Cr') num *= 1e7;
         if (suffix === 'Lakh') num *= 1e5;
         marketCap = num;
      }
    }
    
    return { pe, marketCap };
  } catch (err) {
    console.error(`Google Finance scrape error for ${symbol}:`, err);
    return { pe: 0, marketCap: 0 };
  }
}

export async function fetchStockPrice(symbol: string): Promise<StockPriceData | null> {
  const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
  
  try {
    // 1. Fetch live price, volume, day range from Yahoo v8 Chart API (NO CRUMB NEEDED)
    const chartRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 }
    });
    
    if (chartRes.ok) {
      const data = await chartRes.json();
      const meta = data?.chart?.result?.[0]?.meta;
      
      if (meta && meta.regularMarketPrice) {
        // 2. Fetch PE and Market Cap from Google Finance
        const gfData = await getGoogleFinanceData(symbol);
        
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = price - prevClose;
        const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
        
        return {
          symbol: yahooSymbol,
          name: meta.longName || meta.shortName || getStockName(yahooSymbol),
          price,
          change,
          changePercent,
          marketCap: gfData.marketCap || 0,
          volume: meta.regularMarketVolume || 0,
          dayHigh: meta.regularMarketDayHigh || 0,
          dayLow: meta.regularMarketDayLow || 0,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
          pe: gfData.pe || 0,
          eps: meta.epsTrailingTwelveMonths || 0,
          currency: meta.currency || 'INR',
        };
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching quote for ${yahooSymbol}:`, msg);
  }

  return getFallbackStockPrice(yahooSymbol);
}

export async function fetchChartData(
  symbol: string,
  period: '1d' | '1w' | '1m' | '1y' | '5y' = '1y'
): Promise<ChartData[]> {
  const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
  
  try {
    const rangeMap: Record<string, { range: string; interval: string }> = {
      '1d': { range: '1d', interval: '5m' },
      '1w': { range: '5d', interval: '15m' },
      '1m': { range: '1mo', interval: '1d' },
      '1y': { range: '1y', interval: '1d' },
      '5y': { range: '5y', interval: '1wk' },
    };
    
    const { range, interval } = rangeMap[period];
    
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${range}&interval=${interval}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 }
    });

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const timestamps: number[] = result?.timestamp || [];
      const closes: number[] = result?.indicators?.quote?.[0]?.close || [];

      if (timestamps.length > 0) {
        return timestamps
          .map((ts: number, i: number) => ({
            date: new Date(ts * 1000).toISOString().split('T')[0],
            price: Number(closes[i] || 0),
          }))
          .filter((p: ChartData) => !isNaN(p.price) && p.price > 0);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching chart data for ${yahooSymbol}:`, msg);
  }
  
  return generateMockChartData();
}
