import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianStock } from '@/lib/stocks';
import { fetchChartData } from '@/lib/yahoo-api';

export async function POST(request: NextRequest) {
  try {
    const { symbol, period } = await request.json();

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
    }

    if (!isValidIndianStock(symbol)) {
      return NextResponse.json({ error: 'Only Indian NSE/BSE stocks supported' }, { status: 400 });
    }

    const validPeriods = ['1d', '1w', '1m', '1y', '5y'];
    const safePeriod = validPeriods.includes(period) ? period : '1y';

    const data = await fetchChartData(symbol, safePeriod as '1d' | '1w' | '1m' | '1y' | '5y');
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
