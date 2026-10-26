import { NextResponse } from 'next/server';
import { fetchMarketQuotes } from '@/lib/yahoo-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const market = await fetchMarketQuotes();

    if (!market) {
      return NextResponse.json(
        { error: 'Live market data is currently unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(market, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Live market API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live market data' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
