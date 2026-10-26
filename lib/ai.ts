import { StockPriceData, ChartData } from './stocks';

export type AnalysisProvider = 'gemini' | 'ollama' | 'builtin';

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
  /** Which engine produced this analysis. */
  provider: AnalysisProvider;
}

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.8-flash'];
const DEFAULT_OLLAMA_MODEL = 'llama3.1';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function recommendationFromScore(score: number): 'BUY' | 'HOLD' | 'AVOID' {
  if (score >= 71) return 'BUY';
  if (score >= 41) return 'HOLD';
  return 'AVOID';
}

function resolveProvider(): AnalysisProvider {
  const forced = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  if (forced === 'gemini' || forced === 'ollama' || forced === 'builtin') {
    return forced;
  }
  if (forced === 'none' || forced === 'built-in') {
    return 'builtin';
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    return 'gemini';
  }
  if (process.env.OLLAMA_BASE_URL?.trim()) {
    return 'ollama';
  }

  return 'builtin';
}

function buildPrompt(
  stockData: StockPriceData,
  chartData: ChartData[],
  additionalContext?: string
): string {
  const prices = chartData
    .map((point) => point.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  const currentPrice =
    prices.length > 0 ? prices[prices.length - 1] : stockData.price;
  const sma20 = average(prices.slice(-20)) || currentPrice;
  const sma50 = average(prices.slice(-50)) || currentPrice;
  const periodChangePercent =
    prices.length > 1 && prices[0] > 0
      ? ((currentPrice - prices[0]) / prices[0]) * 100
      : stockData.changePercent;

  const high52 =
    stockData.fiftyTwoWeekHigh > 0
      ? stockData.fiftyTwoWeekHigh
      : Math.max(...prices, currentPrice);
  const low52 =
    stockData.fiftyTwoWeekLow > 0
      ? stockData.fiftyTwoWeekLow
      : Math.min(...prices, currentPrice);
  const rangePosition =
    high52 > low52
      ? clamp(((currentPrice - low52) / (high52 - low52)) * 100, 0, 100)
      : 50;

  const quoteTime = new Date(stockData.dataAsOf).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
  });

  return `
You are an expert financial analyst specializing in Indian stock market analysis. Analyze the following Indian stock using this LIVE market data (quote time: ${quoteTime} IST) and provide a detailed assessment. Take the live price movement into account.

LIVE STOCK INFORMATION:
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
- Price Trend (Available Period): ${periodChangePercent > 0 ? '+' : ''}${periodChangePercent.toFixed(2)}%
- 52-Week High: ₹${high52.toFixed(2)}
- 52-Week Low: ₹${low52.toFixed(2)}
- Position In 52-Week Range: ${rangePosition.toFixed(1)}%

IMPORTANT INSTRUCTIONS:
1. Provide scores ONLY as numbers (0-100) for each category.
2. Base your analysis on the provided data and general market knowledge.
3. Be realistic; avoid overly optimistic or pessimistic assessments.
4. Consider market conditions for Indian stocks.
5. Flag significant risks or opportunities.
6. Do not invent financial data that is not provided.

Respond with a single JSON object in exactly this structure:
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

Respond ONLY with valid JSON, no markdown and no additional text.
`.trim();
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

async function callGemini(
  model: string,
  prompt: string,
  apiKey: string
): Promise<Response> {
  return fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
      cache: 'no-store',
    },
    60_000
  );
}

async function analyzeWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const configuredModel =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  const candidates = [configuredModel, ...GEMINI_FALLBACK_MODELS];
  const tried = new Set<string>();
  let lastError = 'Gemini request failed';

  // Google retires model names and occasionally rate-limits individual models.
  // Try the configured/default model, then a small set of current replacements.
  for (let index = 0; index < candidates.length && tried.size < 4; index += 1) {
    const model = candidates[index];
    if (tried.has(model)) continue;
    tried.add(model);

    const response = await callGemini(model, prompt, apiKey);

    if (response.ok) {
      const data = (await response.json()) as GeminiResponse;
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('') || '';

      if (!text.trim()) {
        throw new Error('Gemini returned an empty response');
      }

      return text;
    }

    const detail = (await response.text()).slice(0, 300);
    lastError = `Gemini request failed (${response.status}): ${detail}`;

    // If Google says the model is retired, prefer its suggested replacement.
    if (response.status === 404) {
      const suggested = [...detail.matchAll(/models\/([A-Za-z0-9._-]+)/g)]
        .map((match) => match[1])
        .find((name) => !tried.has(name));

      if (suggested && !candidates.includes(suggested)) {
        candidates.push(suggested);
      }
    } else if (response.status !== 429 && response.status !== 503) {
      throw new Error(lastError);
    }

    if (index < candidates.length - 1) {
      console.warn(`Gemini model "${model}" unavailable; trying another model`);
    }
  }

  throw new Error(lastError);
}

interface OllamaResponse {
  message?: {
    content?: string;
  };
}

async function analyzeWithOllama(prompt: string): Promise<string> {
  const baseUrl = (
    process.env.OLLAMA_BASE_URL?.trim() || DEFAULT_OLLAMA_URL
  ).replace(/\/+$/, '');
  const model = process.env.OLLAMA_MODEL?.trim() || DEFAULT_OLLAMA_MODEL;
  const timeoutMs =
    Number(process.env.OLLAMA_TIMEOUT_MS) > 0
      ? Number(process.env.OLLAMA_TIMEOUT_MS)
      : 180_000;

  const response = await fetchWithTimeout(
    `${baseUrl}/api/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [{ role: 'user', content: prompt }],
        // Local CPU inference can be slow. Cap the output so a model cannot
        // generate indefinitely and block later analysis requests.
        options: { temperature: 0.3, num_predict: 800, num_ctx: 4096 },
      }),
      cache: 'no-store',
    },
    timeoutMs
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Ollama request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as OllamaResponse;
  const text = data.message?.content || '';

  if (!text.trim()) {
    throw new Error('Ollama returned an empty response');
  }

  return text;
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function toScore(value: unknown): number | null {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numeric)) return null;
  return Math.round(clamp(numeric, 0, 100));
}

function toStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const strings = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  return strings.length > 0 ? strings : fallback;
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function parseAnalysisResponse(
  responseText: string,
  fallback: AIAnalysisResult,
  provider: AnalysisProvider
): AIAnalysisResult | null {
  const json = extractJson(responseText);
  if (!json) return null;

  let parsed: Record<string, unknown>;

  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }

  const fundamentalsScore = toScore(parsed.fundamentalsScore);
  const technicalScore = toScore(parsed.technicalScore);
  const sentimentScore = toScore(parsed.sentimentScore);
  const riskScore = toScore(parsed.riskScore);

  if (
    fundamentalsScore === null ||
    technicalScore === null ||
    sentimentScore === null ||
    riskScore === null
  ) {
    return null;
  }

  const overallScore = Math.round(
    fundamentalsScore * 0.4 +
      technicalScore * 0.3 +
      sentimentScore * 0.2 +
      (100 - riskScore) * 0.1
  );

  const recommendation =
    parsed.recommendation === 'BUY' ||
    parsed.recommendation === 'HOLD' ||
    parsed.recommendation === 'AVOID'
      ? parsed.recommendation
      : recommendationFromScore(overallScore);

  return {
    fundamentalsScore,
    technicalScore,
    sentimentScore,
    riskScore,
    overallScore,
    recommendation,
    reasoning: {
      fundamentals: asText(
        parsed.fundamentalsReasoning,
        fallback.reasoning.fundamentals
      ),
      technicals: asText(
        parsed.technicalReasoning,
        fallback.reasoning.technicals
      ),
      sentiment: asText(parsed.sentimentReasoning, fallback.reasoning.sentiment),
      risk: asText(parsed.riskReasoning, fallback.reasoning.risk),
    },
    keyPoints: toStringArray(parsed.keyPoints, fallback.keyPoints),
    risks: toStringArray(parsed.risks, fallback.risks),
    provider,
  };
}

/**
 * Free, deterministic analysis used when no AI provider is configured or when
 * a configured provider is unavailable. It only uses the live quote and chart
 * data passed in by the API route.
 */
function getBuiltInAnalysis(
  stockData: StockPriceData,
  chartData: ChartData[]
): AIAnalysisResult {
  const prices = chartData
    .map((point) => point.price)
    .filter((price) => Number.isFinite(price) && price > 0);

  const currentPrice =
    stockData.price > 0
      ? stockData.price
      : prices[prices.length - 1] || 0;
  const sma20 = average(prices.slice(-20)) || currentPrice;
  const sma50 = average(prices.slice(-50)) || currentPrice;

  const periodChangePercent =
    prices.length > 1 && prices[0] > 0
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      : stockData.changePercent;

  const high52 =
    stockData.fiftyTwoWeekHigh > 0
      ? stockData.fiftyTwoWeekHigh
      : Math.max(...prices, currentPrice);
  const low52 =
    stockData.fiftyTwoWeekLow > 0
      ? stockData.fiftyTwoWeekLow
      : Math.min(...prices, currentPrice);
  const rangePosition =
    high52 > low52
      ? clamp(((currentPrice - low52) / (high52 - low52)) * 100, 0, 100)
      : 50;

  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice;
  const volatilityPercent =
    minPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : 0;

  const pe = stockData.pe > 0 ? stockData.pe : 0;
  let fundamentalsScore = 60;

  if (pe > 0) {
    if (pe < 15) fundamentalsScore = 85;
    else if (pe < 25) fundamentalsScore = 75;
    else if (pe < 40) fundamentalsScore = 60;
    else if (pe < 60) fundamentalsScore = 45;
    else fundamentalsScore = 30;
  }

  let technicalScore = 50;
  technicalScore += currentPrice >= sma20 ? 15 : -12;
  technicalScore += sma20 >= sma50 ? 10 : -8;
  technicalScore += periodChangePercent > 5 ? 10 : periodChangePercent < -5 ? -10 : 0;
  technicalScore += rangePosition > 75 ? 5 : rangePosition < 25 ? -5 : 0;
  technicalScore = Math.round(clamp(technicalScore, 0, 100));

  const sentimentScore = Math.round(
    clamp(
      50 +
        stockData.changePercent * 4 +
        (periodChangePercent > 0 ? 5 : -5),
      0,
      100
    )
  );

  const drawdownFromHigh =
    high52 > 0 ? ((high52 - currentPrice) / high52) * 100 : 0;
  let riskScore =
    20 + volatilityPercent * 0.5 + Math.max(0, drawdownFromHigh - 20) * 0.3;
  if (pe > 60) riskScore += 10;
  if (rangePosition > 90) riskScore += 5;
  riskScore = Math.round(clamp(riskScore, 10, 95));

  const overallScore = Math.round(
    fundamentalsScore * 0.4 +
      technicalScore * 0.3 +
      sentimentScore * 0.2 +
      (100 - riskScore) * 0.1
  );

  const recommendation = recommendationFromScore(overallScore);
  const aboveSma20 = currentPrice >= sma20;
  const aboveSma50 = currentPrice >= sma50;
  const trendDirection = periodChangePercent >= 0 ? 'positive' : 'negative';

  const keyPoints = [
    `Live price ₹${stockData.price.toFixed(2)} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent.toFixed(2)}% today)`,
    pe > 0 ? `P/E ratio ${pe.toFixed(1)}` : 'P/E ratio unavailable',
    `Trading ${rangePosition.toFixed(0)}% of the way up its 52-week range`,
    `20-day SMA ₹${sma20.toFixed(2)} · 50-day SMA ₹${sma50.toFixed(2)}`,
  ];

  const risks = [
    volatilityPercent > 40
      ? `High price volatility (${volatilityPercent.toFixed(0)}% range in available history)`
      : `Moderate price volatility (${volatilityPercent.toFixed(0)}% range in available history)`,
    rangePosition > 85
      ? 'Trading near its 52-week high; pullback risk is elevated'
      : rangePosition < 15
        ? 'Trading near its 52-week low; momentum is weak'
        : 'Momentum can reverse quickly in the current market',
    pe > 60
      ? 'Elevated valuation multiple leaves little room for disappointment'
      : 'Broader market and sector risks can affect the stock',
  ];

  return {
    fundamentalsScore,
    technicalScore,
    sentimentScore,
    riskScore,
    overallScore,
    recommendation,
    reasoning: {
      fundamentals:
        pe > 0
          ? `The stock trades at a P/E of ${pe.toFixed(
              1
            )}, which is ${
              fundamentalsScore >= 75
                ? 'attractive'
                : fundamentalsScore >= 60
                  ? 'reasonable'
                  : 'rich'
            } relative to typical large-cap ranges. This score uses the live valuation multiple and does not assume undisclosed earnings data.`
          : 'A live P/E ratio is unavailable, so the fundamental score stays neutral. Use additional financial statements before making a decision.',
      technicals: `The price is ${
        aboveSma20 ? 'above' : 'below'
      } its 20-day SMA and ${
        aboveSma50 ? 'above' : 'below'
      } its 50-day SMA. The available-period trend is ${trendDirection} at ${periodChangePercent.toFixed(
        1
      )}%.`,
      sentiment: `Today's move is ${stockData.changePercent.toFixed(
        2
      )}% and the recent trend is ${trendDirection}. This is a live-price sentiment proxy, not a survey of market participants.`,
      risk: `The available price history has a ${volatilityPercent.toFixed(
        0
      )}% high-low range, and the stock sits ${rangePosition.toFixed(
        0
      )}% of the way up its 52-week range. The risk score is ${riskScore}/100 (higher means riskier).`,
    },
    keyPoints,
    risks,
    provider: 'builtin',
  };
}

export async function analyzeStock(
  stockData: StockPriceData,
  chartData: ChartData[],
  additionalContext?: string
): Promise<AIAnalysisResult> {
  const provider = resolveProvider();
  const fallback = getBuiltInAnalysis(stockData, chartData);

  if (provider === 'builtin') {
    return fallback;
  }

  try {
    const prompt = buildPrompt(stockData, chartData, additionalContext);
    const responseText =
      provider === 'gemini'
        ? await analyzeWithGemini(prompt)
        : await analyzeWithOllama(prompt);
    const parsed = parseAnalysisResponse(responseText, fallback, provider);

    if (parsed) return parsed;

    console.warn(
      `${provider} returned invalid analysis JSON; using built-in analysis`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${provider} analysis failed; using built-in analysis:`, message);
  }

  return fallback;
}
