import {
  StockPriceData,
  ChartData,
  LiveMarketData,
  LiveQuoteUpdate,
  getStockName,
} from './stocks';
import { MAJOR_STOCKS } from './watchlist';

const YAHOO_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const SESSION_TTL_MS = 30 * 60 * 1000;
// Yahoo accepts all 44 watchlist symbols in one request. Keeping them in one
// batch is important because the board refreshes once per second.
const QUOTE_BATCH_SIZE = 50;
const LIVE_QUOTE_CACHE_TTL_MS = 750;
const MARKET_CACHE_TTL_MS = 750;

const liveQuoteCache = new Map<
  string,
  { quote: LiveQuoteUpdate; fetchedAt: number }
>();
let cachedMarket: { data: LiveMarketData; fetchedAt: number } | null = null;

interface YahooSession {
  cookie: string;
  crumb: string;
  expiresAt: number;
}

interface YahooQuoteResult {
  symbol?: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketTime?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  marketCap?: number;
  trailingPE?: number;
  epsTrailingTwelveMonths?: number;
  currency?: string;
  marketState?: string;
}

let cachedSession: YahooSession | null = null;

function normalizeSymbol(symbol: string): string {
  return symbol.includes('.') ? symbol.toUpperCase() : `${symbol.toUpperCase()}.NS`;
}

function toNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readSetCookies(headers: Headers): string[] {
  const headersWithCookies = headers as Headers & { getSetCookie?: () => string[] };

  if (typeof headersWithCookies.getSetCookie === 'function') {
    return headersWithCookies.getSetCookie();
  }

  const single = headers.get('set-cookie');
  if (!single) return [];

  // Older Node versions combine multiple Set-Cookie headers into one string.
  return single.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
}

async function createYahooSession(): Promise<YahooSession> {
  const cookieResponse = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': YAHOO_USER_AGENT },
    redirect: 'manual',
    cache: 'no-store',
  });

  const cookie = readSetCookies(cookieResponse.headers)
    .map((entry) => entry.split(';')[0])
    .filter(Boolean)
    .join('; ');

  if (!cookie) {
    throw new Error('Yahoo Finance did not issue a session cookie');
  }

  const crumbResponse = await fetch(
    'https://query1.finance.yahoo.com/v1/test/getcrumb',
    {
      headers: { 'User-Agent': YAHOO_USER_AGENT, Cookie: cookie },
      cache: 'no-store',
    }
  );

  const crumb = (await crumbResponse.text()).trim();

  if (!crumbResponse.ok || !/^[A-Za-z0-9._-]+$/.test(crumb)) {
    throw new Error('Yahoo Finance did not issue a valid crumb');
  }

  return {
    cookie,
    crumb,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

async function getYahooSession(forceRefresh = false): Promise<YahooSession> {
  if (!forceRefresh && cachedSession && cachedSession.expiresAt > Date.now()) {
    return cachedSession;
  }

  cachedSession = await createYahooSession();
  return cachedSession;
}

async function fetchQuoteBatch(
  symbols: string[],
  allowRetry = true
): Promise<YahooQuoteResult[]> {
  const session = await getYahooSession();

  const url = new URL('https://query1.finance.yahoo.com/v7/finance/quote');
  url.searchParams.set('symbols', symbols.join(','));
  url.searchParams.set('crumb', session.crumb);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': YAHOO_USER_AGENT,
      Cookie: session.cookie,
    },
    cache: 'no-store',
  });

  if ((response.status === 401 || response.status === 403) && allowRetry) {
    cachedSession = null;
    await getYahooSession(true);
    return fetchQuoteBatch(symbols, false);
  }

  if (!response.ok) {
    throw new Error(`Yahoo Finance quote request failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  const results = payload?.quoteResponse?.result;

  if (!Array.isArray(results)) {
    throw new Error('Yahoo Finance returned an unexpected quote response');
  }

  return results as YahooQuoteResult[];
}

function normalizeQuote(
  raw: YahooQuoteResult,
  fallbackSymbol: string
): StockPriceData | null {
  const price = toNumber(raw.regularMarketPrice);
  if (price <= 0) return null;

  const symbol = raw.symbol || fallbackSymbol;

  return {
    symbol,
    name: raw.longName || raw.shortName || getStockName(symbol),
    price,
    change: toNumber(raw.regularMarketChange),
    changePercent: toNumber(raw.regularMarketChangePercent),
    marketCap: toNumber(raw.marketCap),
    volume: toNumber(raw.regularMarketVolume),
    dayHigh: toNumber(raw.regularMarketDayHigh),
    dayLow: toNumber(raw.regularMarketDayLow),
    fiftyTwoWeekHigh: toNumber(raw.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: toNumber(raw.fiftyTwoWeekLow),
    pe: toNumber(raw.trailingPE),
    eps: toNumber(raw.epsTrailingTwelveMonths),
    currency: raw.currency || 'INR',
    dataAsOf: raw.regularMarketTime
      ? new Date(raw.regularMarketTime * 1000).toISOString()
      : new Date().toISOString(),
  };
}

/** Fetch a single live quote. Returns null when Yahoo Finance is unavailable. */
export async function fetchStockPrice(symbol: string): Promise<StockPriceData | null> {
  const yahooSymbol = normalizeSymbol(symbol);

  try {
    const results = await fetchQuoteBatch([yahooSymbol]);
    const raw =
      results.find((result) => result.symbol === yahooSymbol) ?? results[0];

    return raw ? normalizeQuote(raw, yahooSymbol) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching live quote for ${yahooSymbol}:`, message);
    return null;
  }
}

interface YahooChartMeta {
  currency?: string;
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketTime?: number;
  regularMarketChangePercent?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  longName?: string;
  shortName?: string;
  currentTradingPeriod?: {
    regular?: {
      start?: number;
      end?: number;
    };
  };
}

function marketStateFromMeta(meta: YahooChartMeta): string {
  const now = Date.now() / 1000;
  const regular = meta.currentTradingPeriod?.regular;

  if (
    typeof regular?.start === 'number' &&
    typeof regular?.end === 'number'
  ) {
    return now >= regular.start && now <= regular.end ? 'REGULAR' : 'CLOSED';
  }

  return 'UNKNOWN';
}

/**
 * Fetch a second-by-second price update from Yahoo's chart endpoint.
 *
 * This endpoint does not need a crumb/cookie session, so a 1-second poll makes
 * only one upstream request. Market cap, P/E and EPS are intentionally omitted
 * and merged from the existing full quote by the client.
 */
export async function fetchLiveQuote(
  symbol: string
): Promise<LiveQuoteUpdate | null> {
  const yahooSymbol = normalizeSymbol(symbol);
  const cached = liveQuoteCache.get(yahooSymbol);

  if (cached && Date.now() - cached.fetchedAt < LIVE_QUOTE_CACHE_TTL_MS) {
    return cached.quote;
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        yahooSymbol
      )}?range=1d&interval=1m`,
      {
        headers: { 'User-Agent': YAHOO_USER_AGENT },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance live quote request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    const meta = data?.chart?.result?.[0]?.meta as YahooChartMeta | undefined;

    if (!meta) return null;

    const price = toNumber(meta.regularMarketPrice);
    if (price <= 0) return null;

    const previousClose =
      toNumber(meta.chartPreviousClose) || toNumber(meta.previousClose) || price;
    const change = price - previousClose;
    const changePercent =
      typeof meta.regularMarketChangePercent === 'number' &&
      Number.isFinite(meta.regularMarketChangePercent)
        ? meta.regularMarketChangePercent
        : previousClose > 0
          ? (change / previousClose) * 100
          : 0;

    const quote: LiveQuoteUpdate = {
      symbol: meta.symbol || yahooSymbol,
      name: meta.longName || meta.shortName || getStockName(yahooSymbol),
      price,
      change,
      changePercent,
      volume: toNumber(meta.regularMarketVolume),
      dayHigh: toNumber(meta.regularMarketDayHigh),
      dayLow: toNumber(meta.regularMarketDayLow),
      fiftyTwoWeekHigh: toNumber(meta.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: toNumber(meta.fiftyTwoWeekLow),
      currency: meta.currency || 'INR',
      dataAsOf: meta.regularMarketTime
        ? new Date(meta.regularMarketTime * 1000).toISOString()
        : new Date().toISOString(),
      marketState: marketStateFromMeta(meta),
    };

    liveQuoteCache.set(yahooSymbol, { quote, fetchedAt: Date.now() });
    return quote;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching live quote for ${yahooSymbol}:`, message);
    return null;
  }
}

/** Fetch live quotes for the market board. Returns null when no live data is available. */
export async function fetchMarketQuotes(): Promise<LiveMarketData | null> {
  if (cachedMarket && Date.now() - cachedMarket.fetchedAt < MARKET_CACHE_TTL_MS) {
    return cachedMarket.data;
  }

  const quotes: StockPriceData[] = [];
  const marketStates = new Set<string>();

  for (let index = 0; index < MAJOR_STOCKS.length; index += QUOTE_BATCH_SIZE) {
    const batch = MAJOR_STOCKS.slice(index, index + QUOTE_BATCH_SIZE);

    try {
      const results = await fetchQuoteBatch(batch.map((stock) => stock.symbol));
      const bySymbol = new Map(results.map((result) => [result.symbol, result]));

      for (const stock of batch) {
        const raw = bySymbol.get(stock.symbol);
        if (!raw) continue;

        const quote = normalizeQuote(raw, stock.symbol);
        if (!quote) continue;

        quotes.push(quote);
        if (raw.marketState) marketStates.add(raw.marketState);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error fetching live market quotes:', message);
    }
  }

  if (quotes.length === 0) return null;

  quotes.sort((a, b) => b.marketCap - a.marketCap);

  const latestQuoteTime = Math.max(
    ...quotes.map((quote) => new Date(quote.dataAsOf).getTime())
  );
  const asOf = new Date(latestQuoteTime);

  const market: LiveMarketData = {
    source: 'Yahoo Finance',
    exchange: 'NSE',
    marketState: [...marketStates].join(', ') || 'UNKNOWN',
    generatedAt: new Date().toISOString(),
    asOf: asOf.toISOString(),
    asOfIST: asOf.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }),
    count: quotes.length,
    quotes,
  };

  cachedMarket = { data: market, fetchedAt: Date.now() };
  return market;
}

/** Fetch live chart history. Returns an empty array when Yahoo Finance is unavailable. */
export async function fetchChartData(
  symbol: string,
  period: '1d' | '1w' | '1m' | '1y' | '5y' = '1y'
): Promise<ChartData[]> {
  const yahooSymbol = normalizeSymbol(symbol);

  try {
    // Use the finest granularity Yahoo exposes for each timeframe so the chart
    // has enough detail to be useful without exceeding Yahoo's point limits.
    const rangeMap: Record<string, { range: string; interval: string }> = {
      '1d': { range: '1d', interval: '1m' },
      '1w': { range: '5d', interval: '5m' },
      '1m': { range: '1mo', interval: '60m' },
      '1y': { range: '1y', interval: '1d' },
      '5y': { range: '5y', interval: '1wk' },
    };

    const { range, interval } = rangeMap[period];

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
        yahooSymbol
      )}?range=${range}&interval=${interval}`,
      {
        headers: { 'User-Agent': YAHOO_USER_AGENT },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance chart request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];
    const timestamps: number[] = Array.isArray(result?.timestamp) ? result.timestamp : [];
    const quote = result?.indicators?.quote?.[0];
    const opens: Array<number | null> = quote?.open || [];
    const highs: Array<number | null> = quote?.high || [];
    const lows: Array<number | null> = quote?.low || [];
    const closes: Array<number | null> = quote?.close || [];
    const volumes: Array<number | null> = quote?.volume || [];

    const positive = (value: unknown): number | null => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const chartData: ChartData[] = [];

    timestamps.forEach((timestamp, index) => {
      const close = positive(closes[index]);
      if (close === null) return;

      const open = positive(opens[index]) ?? close;
      const high = positive(highs[index]) ?? Math.max(open, close);
      const low = positive(lows[index]) ?? Math.min(open, close);
      const volume = Number(volumes[index] ?? 0);

      chartData.push({
        date: new Date(timestamp * 1000).toISOString(),
        price: close,
        timestamp: timestamp * 1000,
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume: Number.isFinite(volume) && volume > 0 ? volume : 0,
      });
    });

    return chartData;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching live chart data for ${yahooSymbol}:`, message);
    return [];
  }
}
