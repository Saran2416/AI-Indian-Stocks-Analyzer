import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianStock } from '@/lib/stocks';
import { fetchLiveQuote } from '@/lib/yahoo-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const rawSymbol = request.nextUrl.searchParams.get('symbol')?.trim();

  if (!rawSymbol) {
    return NextResponse.json(
      { error: 'Missing stock symbol' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const symbol = rawSymbol.includes('.')
    ? rawSymbol.toUpperCase()
    : `${rawSymbol.toUpperCase()}.NS`;

  if (!isValidIndianStock(symbol)) {
    return NextResponse.json(
      { error: 'Only Indian stocks (NSE/BSE) are supported' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const quote = await fetchLiveQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        { error: 'Live stock data is currently unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      {
        quote,
        fetchedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Live quote API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live stock data' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
