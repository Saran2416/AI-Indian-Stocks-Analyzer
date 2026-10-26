import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianStock } from '@/lib/stocks';
import { fetchStockPrice, fetchChartData } from '@/lib/yahoo-api';
import { analyzeStock } from '@/lib/ai';
import { calculateScoreResult } from '@/lib/scoring';

export async function POST(request: NextRequest) {
  try {
    const { symbol } = await request.json();

    if (!symbol || typeof symbol !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing stock symbol' },
        { status: 400 }
      );
    }

    // Validate if stock is Indian
    if (!isValidIndianStock(symbol)) {
      return NextResponse.json(
        { error: 'Only Indian stocks (NSE/BSE) are supported' },
        { status: 400 }
      );
    }

    // Fetch stock data
    const stockData = await fetchStockPrice(symbol);
    if (!stockData) {
      return NextResponse.json(
        { error: 'Live stock data is currently unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch chart data
    const chartData = await fetchChartData(symbol, '1y');
    if (chartData.length === 0) {
      return NextResponse.json(
        { error: 'Live chart data is currently unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Get AI analysis
    const aiAnalysis = await analyzeStock(stockData, chartData);

    // Calculate final score
    const scoreResult = calculateScoreResult(
      aiAnalysis.fundamentalsScore,
      aiAnalysis.technicalScore,
      aiAnalysis.sentimentScore,
      aiAnalysis.riskScore
    );

    return NextResponse.json(
      {
        stock: stockData,
        chartData,
        analysis: {
          ...aiAnalysis,
          ...scoreResult,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while analyzing the stock' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
