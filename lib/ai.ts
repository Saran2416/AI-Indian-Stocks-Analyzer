import Anthropic from '@anthropic-ai/sdk';
import { StockPriceData, ChartData } from './stocks';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysisResult {
  fundamentalsScore: number;
  technicalScore: number;
  sentimentScore: number;
  riskScore: number;
  overallScore: number;
  recommendation: 'BUY' | 'HOLD' | 'AVOID';
  reasoning: {
    fundamentals: string;
    technicals: string;
    sentiment: string;
    risk: string;
  };
  keyPoints: string[];
  risks: string[];
}

export async function analyzeStock(
  stockData: StockPriceData,
  chartData: ChartData[],
  additionalContext?: string
): Promise<AIAnalysisResult> {
  try {
    // Calculate basic technical indicators
    const prices = chartData.map(d => d.price);
    const currentPrice = prices[prices.length - 1];
    const priceChange = currentPrice - prices[0];
    const priceChangePercent = (priceChange / prices[0]) * 100;
    
    // Simple moving average
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20);
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(prices.length, 50);

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const prompt = `
You are an expert financial analyst specializing in Indian stock market analysis. Analyze the following Indian stock using this REAL-TIME, LIVE market data (current time: ${now} IST) and provide a detailed assessment. Ensure that your recommendations take into account the live price movement mentioned below.

REAL-TIME STOCK INFORMATION:
- Company: ${stockData.name} (${stockData.symbol})
- Current Price: ₹${stockData.price.toFixed(2)}
- Price Change: ${stockData.change > 0 ? '+' : ''}${stockData.change.toFixed(2)} (${stockData.changePercent.toFixed(2)}%)
- Market Cap: ₹${(stockData.marketCap / 1e9).toFixed(2)}B
- Volume: ${stockData.volume.toLocaleString()}
- P/E Ratio: ${stockData.pe > 0 ? stockData.pe.toFixed(2) : 'N/A'}
- EPS: ${stockData.eps > 0 ? stockData.eps.toFixed(2) : 'N/A'}

TECHNICAL DATA:
- 20-Day Moving Average: ₹${sma20.toFixed(2)}
- 50-Day Moving Average: ₹${sma50.toFixed(2)}
- Price Trend (Last Period): ${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%
- 52-Week High: ₹${stockData.fiftyTwoWeekHigh.toFixed(2)}
- 52-Week Low: ₹${stockData.fiftyTwoWeekLow.toFixed(2)}

IMPORTANT INSTRUCTIONS:
1. Provide scores ONLY as numbers (0-100) for each category
2. Base your analysis on the provided data and general market knowledge
3. Be realistic and avoid overly optimistic/pessimistic assessments
4. Consider market conditions for Indian stocks
5. Flag any significant risks or opportunities

Please provide your analysis in the following JSON format:
{
  "fundamentalsScore": <0-100>,
  "technicalScore": <0-100>,
  "sentimentScore": <0-100>,
  "riskScore": <0-100>,
  "recommendation": "<BUY|HOLD|AVOID>",
  "fundamentalsReasoning": "<2-3 sentences>",
  "technicalReasoning": "<2-3 sentences>",
  "sentimentReasoning": "<2-3 sentences>",
  "riskReasoning": "<2-3 sentences>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "risks": ["<risk1>", "<risk2>", "<risk3>"]
}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Respond ONLY with valid JSON, no additional text.
`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultAnalysis(stockData, chartData);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Calculate weighted overall score (40% fundamentals, 30% technicals, 20% sentiment, 10% risk)
    const overallScore = Math.round(
      analysis.fundamentalsScore * 0.4 +
      analysis.technicalScore * 0.3 +
      analysis.sentimentScore * 0.2 +
      (100 - analysis.riskScore) * 0.1 // Inverse risk score
    );

    return {
      fundamentalsScore: analysis.fundamentalsScore,
      technicalScore: analysis.technicalScore,
      sentimentScore: analysis.sentimentScore,
      riskScore: analysis.riskScore,
      overallScore,
      recommendation: analysis.recommendation,
      reasoning: {
        fundamentals: analysis.fundamentalsReasoning,
        technicals: analysis.technicalReasoning,
        sentiment: analysis.sentimentReasoning,
        risk: analysis.riskReasoning,
      },
      keyPoints: analysis.keyPoints || [],
      risks: analysis.risks || [],
    };
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return getDefaultAnalysis(stockData, chartData);
  }
}

// Default analysis when API fails
function getDefaultAnalysis(stockData?: StockPriceData, chartData?: ChartData[]): AIAnalysisResult {
  if (!stockData || !chartData || chartData.length === 0) {
    return {
      fundamentalsScore: 65,
      technicalScore: 60,
      sentimentScore: 55,
      riskScore: 40,
      overallScore: 60,
      recommendation: 'HOLD',
      reasoning: {
        fundamentals: 'Unable to fetch detailed analysis at this moment.',
        technicals: 'Default technical assessment provided.',
        sentiment: 'Market sentiment data unavailable.',
        risk: 'Moderate risk level estimated.',
      },
      keyPoints: [
        'Please try again in a moment',
        'Real-time data may be delayed',
        'Consider other sources for decision making',
      ],
      risks: [
        'API connectivity issues',
        'Data freshness concerns',
        'Limited analysis scope',
      ],
    };
  }

  // Generate dynamic analysis based on actual data
  const pe = stockData.pe > 0 ? stockData.pe : 25;
  const fundamentalsScore = pe < 20 ? 80 : pe < 30 ? 60 : 40;
  
  const prices = chartData.map(d => d.price);
  const currentPrice = prices[prices.length - 1] || stockData.price;
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / Math.min(prices.length, 20);
  const technicalScore = currentPrice > sma20 ? 75 : 45;
  
  const sentimentScore = stockData.changePercent > 0 ? 70 : 40;
  
  const volatility = prices.length > 0 ? (Math.max(...prices) - Math.min(...prices)) / Math.min(...prices) : 0;
  const riskScore = Math.min(100, Math.max(10, Math.round(volatility * 100 + 20)));

  const overallScore = Math.round(
    fundamentalsScore * 0.4 +
    technicalScore * 0.3 +
    sentimentScore * 0.2 +
    (100 - riskScore) * 0.1
  );

  let recommendation: 'BUY' | 'HOLD' | 'AVOID' = 'HOLD';
  if (overallScore > 65) recommendation = 'BUY';
  else if (overallScore < 45) recommendation = 'AVOID';

  return {
    fundamentalsScore,
    technicalScore,
    sentimentScore,
    riskScore,
    overallScore,
    recommendation,
    reasoning: {
      fundamentals: `P/E ratio of ${stockData.pe.toFixed(1)} indicates ${fundamentalsScore > 60 ? 'good' : 'moderate'} valuation.`,
      technicals: `Price is ${currentPrice > sma20 ? 'above' : 'below'} the 20-day moving average.`,
      sentiment: `Recent price movement of ${stockData.changePercent.toFixed(2)}% drives sentiment.`,
      risk: `Volatility assessment suggests a risk score of ${riskScore}/100.`,
    },
    keyPoints: [
      `Current Price is ₹${stockData.price.toFixed(2)}`,
      `PE Ratio is ${stockData.pe.toFixed(1)}`,
      `Trend is ${stockData.changePercent > 0 ? 'Positive' : 'Negative'}`
    ],
    risks: [
      `Market Volatility (Risk: ${riskScore}/100)`,
      'Live metric analysis enabled'
    ],
  };
}
