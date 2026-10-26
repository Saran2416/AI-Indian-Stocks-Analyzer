# 📊 AI Indian Stock Analyzer

A production-ready, AI-powered web application for analyzing Indian stocks (NSE/BSE) with real-time data, intelligent recommendations, and beautiful UI.

## 🌟 Features

✅ **Stock Search with Autocomplete** - Search for Indian stocks by name or ticker
✅ **Real-time Price Data** - Live stock prices, volume, P/E ratio, market cap
✅ **Live Market Board** - Top NSE stocks with quotes refreshed every second while the market is open
✅ **Live UI Feedback** - Ticking IST clock, live/paused status, and green/red price flashes as quotes change
✅ **Live Detailed Charts** - Area, candlestick, volume, and period-return views across 1D, 1W, 1M, 1Y, and 5Y timeframes
✅ **Technical Overlays** - SMA 20/50 overlays, OHLC/volume tooltips, period statistics, and a live-updating final candle
✅ **AI-Powered Analysis** - Free analysis using Google Gemini (free tier), local Ollama, or the built-in analyzer:
  - Fundamentals Assessment
  - Technical Analysis
  - Market Sentiment
  - Risk Evaluation
✅ **No Paid AI Required** - Works with no API key; Gemini and Ollama are optional free upgrades
✅ **AI Score System (0-100)** - Weighted scoring:
  - Fundamentals: 40%
  - Technicals: 30%
  - Sentiment: 20%
  - Risk: 10%
✅ **Recommendation Badges** - BUY / HOLD / AVOID signals
✅ **Beautiful Dark Theme** - Glassmorphism design with smooth animations
✅ **Responsive Design** - Works on mobile, tablet, and desktop
✅ **Risk Disclosure** - Clear disclaimer for regulatory compliance

## 🎯 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 18+, Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Backend**: Next.js API Routes
- **AI**: Google Gemini free tier, local Ollama, or built-in analyzer (no paid API)
- **Data Sources**: Yahoo Finance API
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Optional: a free Google Gemini API key or local Ollama for LLM analysis. The built-in analyzer works without either.

### Setup

1. Clone the repository
```bash
cd "AI stock analyzer"
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` (optional — only needed for Gemini or Ollama)
```bash
cp .env.local.example .env.local
```

4. Choose a free AI provider in `.env.local`:
```
# Option A: Google Gemini free tier (no billing required)
GEMINI_API_KEY=your_key_from_aistudio.google.com

# Option B: local Ollama (no key)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```
If you leave both unset, the app automatically uses its built-in analyzer.

5. Run the development server
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Usage

1. **Search** - Type a stock name or ticker in the search box (e.g., "TCS", "RELIANCE", "INFY")
2. **View Analysis** - The app fetches real-time data and AI analysis
3. **Review** - Check the AI score, recommendation, and detailed insights
4. **Invest Wisely** - Use the analysis along with your own research

## 📊 Supported Indian Stocks

The app supports major Indian stocks from NSE and BSE including:

- **IT**: TCS, Infosys, Wipro, HCL Tech
- **Banking**: HDFC Bank, ICICI Bank, SBI, Axis Bank
- **Finance**: Bajaj Finserv, HDFC, ICICI Prudential
- **Auto**: Maruti, Bajaj Auto, Hero MotoCorp
- **Energy**: Reliance, NTPC, Power Grid, Coal India
- **Pharma**: Sun Pharma, Cipla, Lupin, Dr. Reddy's
- **FMCG**: Hindustan Unilever, Nestlé India, ITC, Britannia
- **Steel**: Tata Steel, JSW Steel, SAIL
- **Others**: Asian Paints, Bharti Airtel, LT, and more...

## 🏗️ Project Structure

```
/app
  /api/analyze                 # AI analysis API endpoint
    route.ts
  /layout.tsx                  # App layout
  /page.tsx                    # Main page
  /globals.css                 # Global styles

/components
  StockSearch.tsx              # Stock search with autocomplete
  StockCard.tsx                # Current price & metrics display
  StockChart.tsx               # Live area/candle/volume/return chart with SMA overlays
  AIScoreGauge.tsx             # AI score gauge visualization
  RecommendationBadge.tsx      # BUY/HOLD/AVOID badge
  AnalysisPanels.tsx           # Fundamentals, Technical, Sentiment, Risk

/lib
  stocks.ts                    # Shared types and stock helpers
  yahoo-api.ts                 # Live Yahoo Finance quotes and charts
  watchlist.ts                 # Symbols shown on the live market board
  ai.ts                        # Free AI providers + built-in analysis
  scoring.ts                   # Score calculation logic

/hooks
  useLiveQuote.ts              # 1-second selected-stock price polling

/public                        # Static assets
```

## 🔌 API Endpoints

### GET /api/market

Returns live quotes for the market board, refreshed once per second while the market is open. Responses return `503` if Yahoo Finance is unavailable — no stale or estimated prices are served.

### GET /api/quote?symbol=TCS.NS

Returns a lightweight live price update for one stock. The selected stock card polls this endpoint every second. It includes the source quote timestamp and is merged with the analysis snapshot on the client.

### POST /api/chart

Returns OHLCV bars for the selected timeframe. The chart requests `1d`, `1w`, `1m`, `1y`, or `5y`; Yahoo data is used as-is with no synthetic bars.

**Request:**
```json
{
  "symbol": "TCS.NS",
  "period": "1d"
}
```

**Response:**
```json
{
  "data": [
    {
      "date": "2026-10-26T03:45:00.000Z",
      "timestamp": 1792986300000,
      "open": 2497.3,
      "high": 2522.0,
      "low": 2497.3,
      "close": 2507.4,
      "price": 2507.4,
      "volume": 76884
    }
  ]
}
```

### POST /api/analyze

Analyze a stock and get AI-powered insights.

**Request:**
```json
{
  "symbol": "TCS.NS"
}
```

**Response:**
```json
{
  "stock": {
    "symbol": "TCS.NS",
    "name": "Tata Consultancy Services",
    "price": 2521.00,
    "change": -9.00,
    "changePercent": -0.36,
    "marketCap": 9121198768128,
    "volume": 2123175,
    "dataAsOf": "2026-10-26T06:37:26.000Z"
  },
  "chartData": [
    {
      "date": "2026-10-23T03:45:00.000Z",
      "timestamp": 1792727100000,
      "open": 2510.0,
      "high": 2532.8,
      "low": 2502.1,
      "close": 2522.4,
      "price": 2522.4,
      "volume": 1946312
    },
    ...
  ],
  "analysis": {
    "fundamentalsScore": 75,
    "technicalScore": 70,
    "sentimentScore": 65,
    "riskScore": 30,
    "overall": 70,
    "recommendation": "BUY",
    "reasoning": {
      "fundamentals": "Strong earnings growth...",
      "technicals": "Positive momentum...",
      "sentiment": "Bullish market sentiment...",
      "risk": "Moderate risk levels..."
    },
    "keyPoints": [...],
    "risks": [...]
  }
}
```

## 🎨 Design Highlights

- **Glassmorphism Cards** - Semi-transparent cards with backdrop blur
- **Smooth Animations** - Framer Motion for elegant transitions
- **Dark Theme** - Easy on the eyes with accent colors (cyan/blue)
- **Responsive Grid** - Adapts to all screen sizes
- **Interactive Elements** - Hover effects and gesture feedback

## 🧠 AI Analysis System

The app supports three free analysis engines and selects one automatically:

1. **Google Gemini (free tier)** — set `GEMINI_API_KEY`. Get a key from [Google AI Studio](https://aistudio.google.com/apikey); no billing is required for the free tier.
2. **Ollama (100% local)** — set `OLLAMA_BASE_URL` after installing [Ollama](https://ollama.com) and pulling a model, e.g. `ollama pull llama3.1`.
3. **Built-in analyzer** — used automatically when no provider is configured or a provider is unavailable. It derives a deterministic assessment from the live quote and price history; no API key is needed.

You can force a provider with `AI_PROVIDER=gemini`, `AI_PROVIDER=ollama`, or `AI_PROVIDER=builtin`.

The analysis covers:

1. **Fundamentals (40%)** - P/E ratio, earnings, market cap, growth trends
2. **Technicals (30%)** - Price momentum, moving averages, trends
3. **Sentiment (20%)** - Market mood, price momentum, recent data
4. **Risk (10%)** - Volatility, downside risks, market exposure

Final Score = (Fundamentals × 0.4) + (Technicals × 0.3) + (Sentiment × 0.2) + ((100 - Risk) × 0.1)

### Score Ranges

- **71-100**: 🟢 **BUY** - Strong buy signal
- **41-70**: 🟡 **HOLD** - Monitor for opportunities
- **0-40**: 🔴 **AVOID** - Consider better options

## ⚠️ Important Disclaimer

**This is AI-based analysis, not financial advice.**

- The information is for educational/informational purposes only
- AI analysis may contain inaccuracies or biases
- Always do your own research before investing
- Consult with a qualified financial advisor
- Stock market investments carry significant risk
- Past performance doesn't guarantee future results

## 📡 Live Data Only

Quotes and chart history are fetched live from Yahoo Finance. The landing board polls every second while the NSE market is open (every 30 seconds when closed), and the selected stock's price also polls every second while open (every 30 seconds when closed). A short 750 ms in-memory coalescing cache prevents duplicate upstream requests from multiple components; it is not a stale-data fallback.

The detailed chart merges the selected stock's live quote into the final bar every second, so the latest candle/line moves with the price feed. The underlying OHLCV bars are refreshed from Yahoo every 60 seconds, which adds new intraday candles and updated volume while preserving the same live-only data source.

Yahoo's NSE feed is near-real-time and can lag by a few seconds. The UI displays the source quote timestamp so you can see exactly how fresh each price is. AI analysis is a snapshot taken when you run it; only the price and chart's final bar keep ticking afterwards.

There are no mock, estimated, or snapshot prices in the app. If Yahoo Finance is unreachable, the UI shows an error (or keeps the last live update with a clear warning) instead of silently presenting stale data as current.

## 🔐 Environment Variables

Required:
- None. The app works without an `.env.local` file.

Optional AI (all free):
- `GEMINI_API_KEY` - Google Gemini API key. The free tier is sufficient; no billing required.
- `GEMINI_MODEL` - Gemini model name (default: `gemini-3.5-flash`; the app retries with newer fallback models if one is retired or busy)
- `OLLAMA_BASE_URL` - Local Ollama server (for example `http://localhost:11434`)
- `OLLAMA_MODEL` - Ollama model name (default: `llama3.1`)
- `OLLAMA_TIMEOUT_MS` - Ollama request timeout in milliseconds (default: `180000`; CPU-only inference can be slow)
- `AI_PROVIDER` - Force `gemini`, `ollama`, or `builtin`

Optional data:
- `YAHOO_FINANCE_API_KEY` - Reserved for a paid Yahoo Finance API; not needed for the current live data source.

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. (Optional) Add `GEMINI_API_KEY` for Gemini free-tier analysis. Built-in analysis works without it.
4. Deploy!

### Other Platforms

```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

**Issue**: "Live stock data is currently unavailable"
- Check internet connection
- Verify stock symbol is correct (should be NSE/BSE listed)
- Yahoo Finance may be rate-limited; retry in a moment
- The app intentionally returns an error instead of stale or estimated prices

**Issue**: AI analysis falls back to built-in analysis
- This is expected when no AI provider is configured.
- To use Gemini free tier, set `GEMINI_API_KEY` in `.env.local` and restart the dev server.
- Check that the key is valid and the free-tier quota is not exhausted.
- For Ollama, make sure `ollama serve` is running and the configured model is pulled (`ollama pull llama3.1`).

**Issue**: Slow performance
- Clear browser cache
- Disable browser extensions
- Try in private/incognito mode

## 📝 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review GitHub issues
3. Check documentation

## 🎉 Credits

- Built with Next.js and React
- AI powered by Google Gemini, Ollama, or the built-in analyzer
- Data from Yahoo Finance
- Icons by Lucide React
- Animations by Framer Motion
- Styled with Tailwind CSS

## 🔮 Future Features

- Compare multiple stocks
- Watchlist functionality
- Dark/Light theme toggle
- Advanced analysis modes
- Email alerts
- Portfolio tracking

---

**Made with ❤️ for Indian stock traders and investors**
