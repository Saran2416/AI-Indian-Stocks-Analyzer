import { NextRequest, NextResponse } from 'next/server';

interface IndianQuote {
  symbol: string;
  name: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ quotes: [] });
  }

  try {
    // Yahoo Finance Search API
    const response = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        query
      )}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_words_query`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        next: { revalidate: 3600 }, // Cache search results for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error('Yahoo Search API failed');
    }

    const data = await response.json();
    
    // Filter for Indian stocks (NSI = NSE, BSE = BSE)
    const indianQuotes: IndianQuote[] = (data.quotes || [])
      .filter((quote: { exchange: string; symbol: string }) => 
        (quote.exchange === 'NSI' || quote.exchange === 'BSE') && 
        (quote.symbol.endsWith('.NS') || quote.symbol.endsWith('.BO'))
      )
      .map((quote: { symbol: string; longname?: string; shortname?: string }) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
      }));

    // FALLBACK 2: Search Google Finance if still empty using a specialized scraper
    if (indianQuotes.length <= 1) {
      try {
        const googleSearchUrl = `https://www.google.com/finance/search?q=${encodeURIComponent(query)}`;
        const gResponse = await fetch(googleSearchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          }
        });
        
        if (gResponse.ok) {
          const html = await gResponse.text();
          // Look for patterns like "/finance/quote/SYMBOL:EXCHANGE"
          const matches = html.matchAll(/\/finance\/quote\/([A-Z0-9.\-_]+):(NSE|BSE)/g);
          const foundSymbols = new Set<string>();
          
          for (const match of matches) {
            const sym = match[1];
            const exch = match[2];
            const yahooSym = exch === 'NSE' ? `${sym}.NS` : `${sym}.BO`;
            
            if (!foundSymbols.has(yahooSym) && !indianQuotes.some((q: IndianQuote) => q.symbol === yahooSym)) {
              foundSymbols.add(yahooSym);
              indianQuotes.unshift({
                symbol: yahooSym,
                name: `${sym} (${exch === 'NSE' ? 'NSE' : 'BSE'})`,
              });
            }
            if (foundSymbols.size >= 3) break;
          }
        }
      } catch (e) {
        console.error('Google Search fallback failed:', e);
      }
    }

    // FINAL POLISH: Specific high-priority names if still missing
    const queryLower = query.toLowerCase();
    if (indianQuotes.length <= 2) {
      if (
        (queryLower === 'zomato' || queryLower === 'eternal') &&
        !indianQuotes.some((q: IndianQuote) => q.symbol === 'ETERNAL.NS')
      ) {
        indianQuotes.unshift({ symbol: 'ETERNAL.NS', name: 'Eternal Limited (Zomato)' });
      }
      if (queryLower === 'paytm' && !indianQuotes.some((q: IndianQuote) => q.symbol === 'PAYTM.NS')) {
        indianQuotes.unshift({ symbol: 'PAYTM.NS', name: 'One 97 Communications (Paytm)' });
      }
    }

    return NextResponse.json({ quotes: indianQuotes });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
