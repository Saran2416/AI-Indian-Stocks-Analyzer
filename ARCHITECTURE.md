# 📊 AI Indian Stock Analyzer - Visual Architecture

## 🎯 Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SEARCH COMPONENT (StockSearch.tsx)                      │   │
│  │  ├─ Autocomplete Dropdown                                │   │
│  │  ├─ Stock Suggestions                                    │   │
│  │  └─ Input Validation                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓ On Select                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ANALYSIS DISPLAY COMPONENTS                             │   │
│  ├─ StockCard (Price & Metrics)                             │   │
│  ├─ StockChart (Multi-mode live OHLCV chart)                 │   │
│  ├─ AIScoreGauge (0-100 visualization)                      │   │
│  ├─ RecommendationBadge (BUY/HOLD/AVOID)                    │   │
│  │                                                           │   │
│  ├─ AnalysisPanels:                                         │   │
│  │  ├─ Fundamentals Panel                                   │   │
│  │  ├─ Technical Panel                                      │   │
│  │  ├─ Sentiment Panel                                      │   │
│  │  └─ Risk Panel                                           │   │
│  │                                                           │   │
│  ├─ Key Highlights Section                                  │   │
│  └─ Risk Factors Section                                    │   │
│                                                              │   │
└─────────────────────────────────────────────────────────────┘   │
                      ↓ User Input / API Calls
└─────────────────────────────────────────────────────────────────┘
                            ↓↓↓
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  POST /api/analyze                                               │
│  ├─ Input: { symbol: string }                                    │
│  ├─ Validation: Check if Indian stock                            │
│  ├─ Processing:                                                  │
│  │  ├─ Fetch real-time price data                               │
│  │  ├─ Fetch historical chart data                              │
│  │  ├─ Call AI for analysis                                     │
│  │  └─ Calculate weighted score                                 │
│  └─ Output: Complete analysis JSON                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
        ↓ Data Fetch              ↓ AI Analysis       ↓ Scoring
  ┌──────────────┐          ┌──────────────────┐    ┌────────────────┐
  │ YAHOO        │          │ GEMINI / OLLAMA  │    │ SCORING ENGINE │
  │ FINANCE API  │          │ / BUILT-IN       │    │ (lib/scoring)  │
  └──────────────┘          └──────────────────┘    └────────────────┘
```

---

## 📁 Complete File Structure

```
📦 AI Stock Analyzer
│
├── 📄 package.json                 # Dependencies & scripts
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 tailwind.config.ts           # Tailwind CSS config
├── 📄 postcss.config.js            # PostCSS config
├── 📄 next.config.js               # Next.js configuration
├── 📄 .env.local.example           # Environment template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📚 Documentation
│   ├── 📄 README.md                # Main documentation
│   ├── 📄 SETUP_GUIDE.md           # Step-by-step setup
│   ├── 📄 FEATURES.md              # Feature details
│   ├── 📄 PROJECT_SUMMARY.md       # Project overview
│   └── 📄 ARCHITECTURE.md          # This file
│
├── 📂 /app                         # Next.js App Router
│   ├── 📄 layout.tsx               # Root layout
│   ├── 📄 page.tsx                 # Main page (/ route)
│   ├── 📄 globals.css              # Global styles
│   │
│   └── 📂 /api
│       ├── 📂 /analyze
│       │   └── 📄 route.ts         # POST /api/analyze endpoint
│       ├── 📂 /chart
│       │   └── 📄 route.ts         # POST /api/chart OHLCV endpoint
│       ├── 📂 /market
│       │   └── 📄 route.ts         # GET /api/market live board endpoint
│       ├── 📂 /quote
│       │   └── 📄 route.ts         # GET /api/quote second-by-second price endpoint
│       └── 📂 /search
│           └── 📄 route.ts         # GET /api/search endpoint
│
├── 📂 /components                  # React Components
│   ├── 📄 StockSearch.tsx          # Search with autocomplete
│   ├── 📄 StockCard.tsx            # Live price & metrics display
│   ├── 📄 StockChart.tsx           # Live area/candle/volume/return chart
│   ├── 📄 LiveMarketPanel.tsx      # 1-second live market board
│   ├── 📄 LiveClock.tsx            # Ticking IST clock
│   ├── 📄 LivePrice.tsx            # Green/red price tick animation
│   ├── 📄 AIScoreGauge.tsx         # Score visualization
│   ├── 📄 RecommendationBadge.tsx  # Recommendation display
│   └── 📄 AnalysisPanels.tsx       # Analysis panels
│
├── 📂 /lib                         # Utility Functions
│   ├── 📄 stocks.ts                # Shared data types & helpers
│   ├── 📄 yahoo-api.ts             # Live Yahoo Finance quotes & charts
│   ├── 📄 watchlist.ts             # Market board symbols
│   ├── 📄 ai.ts                    # Gemini / Ollama / built-in analysis
│   └── 📄 scoring.ts               # Score calculation
│
├── 📂 /hooks                       # Client Hooks
│   └── 📄 useLiveQuote.ts          # 1-second selected-stock polling
│
├── 📂 /public                      # Static assets
│
└── 📂 Setup Scripts
    ├── 📄 setup.sh                 # Mac/Linux setup
    └── 📄 setup.bat                # Windows setup
```

---

## 🔄 Component Hierarchy

```
<RootLayout>
│
└── <Page>
    │
    ├── <Header>
    │   └── Title & Tagline
    │
    ├── <MainContent>
    │   │
    │   ├── <StockSearch>
    │   │   └─ useEffect for suggestions
    │   │   └─ onClick → handleStockSelect
    │   │
    │   └── {isLoading && <LoadingSpinner>}
    │
    │   └── {analysisData && (
    │       │
    │       ├── <StockChart>
    │       │   └─ useState for timeframe
    │       │
    │       ├── <StockCard>
    │       │   └─ Static data display
    │       │
    │       ├── <AIScoreGauge>
    │       │   └─ Animated gauge
    │       │
    │       ├── <RecommendationBadge>
    │       │   └─ Recommendation display
    │       │
    │       ├── <FundamentalsPanel>
    │       ├── <TechnicalPanel>
    │       ├── <SentimentPanel>
    │       └── <RiskPanel>
    │       │
    │       ├── <KeyHighlights>
    │       └── <RiskFactors>
    │   )}
    │
    └── <Footer>
        └── Disclaimer
```

---

## 🌊 Data Flow Sequence

```
1. USER INTERACTION
   User types stock name → Autocomplete shows suggestions → User clicks

2. API CALL
   POST /api/analyze { symbol: "TCS.NS" }

3. DATA VALIDATION
   Is "TCS.NS" a valid Indian stock? ✓ Yes
   Continue...

4. DATA FETCHING (Parallel)
   ├─ Fetch Stock Price (Yahoo Finance)
   │  └─ Returns: price, change, marketCap, volume, PE, EPS
   │
   └─ Fetch Chart Data (Yahoo Finance)
      └─ Returns: Array of OHLCV points
         { date, timestamp, open, high, low, close, price, volume }

5. AI ANALYSIS
   Gemini, Ollama, or the built-in analyzer processes:
   ├─ Fundamentals (P/E, earnings, market cap)
   ├─ Technical (moving averages, momentum)
   ├─ Sentiment (price trends, volume)
   └─ Risk (volatility, concerns)
   
   Returns JSON with scores for each

6. SCORE CALCULATION
   overall = (fund × 0.4) + (tech × 0.3) + (sent × 0.2) + ((100-risk) × 0.1)

7. RECOMMENDATION LOGIC
   if (overall >= 71) → "BUY"
   else if (overall >= 41) → "HOLD"
   else → "AVOID"

8. RESPONSE CONSTRUCTION
   {
     stock: { StockPriceData },
     chartData: [ { date, timestamp, open, high, low, close, price, volume } ],
     analysis: { entire analysis + scores }
   }

9. FRONTEND DISPLAY
   Components render analysis data with animations
   User sees complete stock analysis

10. LIVE PRICE AND CHART UPDATES
   useLiveQuote polls GET /api/quote?symbol=... every second while the market is open
   LiveMarketPanel polls GET /api/market every second while the market is open
   Polling slows to every 30 seconds when the market is closed
   StockChart merges the live quote into its final OHLCV bar every second
   StockChart refreshes the underlying Yahoo bars every 60 seconds
   Prices and the final chart bar update in place; AI scores stay as the analysis snapshot
   Chart modes: Area, Candles, Volume, and Period Returns, with optional SMA 20/50 overlays
```

---

## 🎨 Component Props Flow

```
<Page>
  ↓
  onSelect(symbol) → fetch /api/analyze
  ↓
  <StockSearch>
    onSelect: (symbol) => void
    isLoading: boolean

  <StockCard>
    stock: StockPriceData
    isLoading?: boolean
    isLive?: boolean

  <StockChart>
    data: ChartData[]
    symbol: string
    liveQuote?: StockPriceData | null
    isLive?: boolean
    isLoading?: boolean

  <AIScoreGauge>
    score: number (0-100)
    recommendation: "BUY" | "HOLD" | "AVOID"
    isLoading?: boolean

  <RecommendationBadge>
    recommendation: "BUY" | "HOLD" | "AVOID"
    score: number

  <FundamentalsPanel>
    score: number
    reasoning: string
    isLoading?: boolean

  <TechnicalPanel>
    score: number
    reasoning: string
    isLoading?: boolean

  <SentimentPanel>
    score: number
    reasoning: string
    isLoading?: boolean

  <RiskPanel>
    score: number
    reasoning: string
    isLoading?: boolean
```

---

## 📡 API Contract

### Request
```typescript
POST /api/analyze
Content-Type: application/json

{
  "symbol": "TCS.NS"
}
```

### Response (Success)
```typescript
{
  "stock": {
    "symbol": "TCS.NS",
    "name": "Tata Consultancy Services",
    "price": 2521.00,
    "change": -9.00,
    "changePercent": -0.36,
    "marketCap": 9121198768128,
    "volume": 2123175,
    "dayHigh": 2549.7,
    "dayLow": 2491.6,
    "fiftyTwoWeekHigh": 3350,
    "fiftyTwoWeekLow": 1976.8,
    "pe": 17.67,
    "eps": 142.66,
    "currency": "INR",
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
    {
      "date": "2026-10-26T03:45:00.000Z",
      "timestamp": 1792986300000,
      "open": 2497.3,
      "high": 2549.7,
      "low": 2491.6,
      "close": 2521.0,
      "price": 2521.0,
      "volume": 2963706
    }
    // ... OHLCV bars for the selected period
  ],
  "analysis": {
    // Analysis scores
    "fundamentalsScore": 75,
    "technicalScore": 70,
    "sentimentScore": 65,
    "riskScore": 30,
    "overall": 70,
    "recommendation": "BUY",

    // Detailed reasoning
    "reasoning": {
      "fundamentals": "String explaining...",
      "technicals": "String explaining...",
      "sentiment": "String explaining...",
      "risk": "String explaining..."
    },

    // Auto-generated insights
    "keyPoints": [
      "Strong earnings growth",
      "Good technical momentum",
      "Market leadership position"
    ],
    "risks": [
      "Valuation concerns",
      "Sector cyclical nature",
      "Competitive pressure"
    ],

    // Color assists
    "color": "green"
  }
}
```

### Chart Request
```typescript
POST /api/chart
Content-Type: application/json

{
  "symbol": "TCS.NS",
  "period": "1d" // 1d | 1w | 1m | 1y | 5y
}
```

### Chart Response (Success)
```typescript
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

Yahoo intervals: `1d` → 1-minute, `1w` → 5-minute, `1m` → hourly, `1y` → daily, `5y` → weekly. The endpoint returns `503` when live Yahoo data is unavailable; it never generates synthetic bars.

### Response (Error)
```typescript
{
  "error": "Only Indian stocks (NSE/BSE) are supported"
}

Status: 400 | 404 | 500 | 503
```

---

## 🛠️ Tech Stack Dependencies

```
Production Dependencies:
├─ react@18.3.1              # UI library
├─ react-dom@18.3.1          # React DOM
├─ next@14.2.0               # Framework
├─ framer-motion@10.16.19    # Animations
├─ recharts@2.12.6           # Charts
├─ axios@1.6.7               # HTTP client
└─ lucide-react@0.408.0      # Icons

Development Dependencies:
├─ typescript@5.3.3          # Type safety
├─ @types/node@20.10.6       # Node types
├─ @types/react@18.2.46      # React types
├─ @types/react-dom@18.2.18  # React DOM types
├─ tailwindcss@3.4.1         # Styling
├─ postcss@8.4.32            # CSS processing
├─ autoprefixer@10.4.16      # CSS prefixes
├─ eslint@8.56.0             # Linting
└─ eslint-config-next@14.2.0 # Next.js linting
```

---

## ⚙️ Configuration Details

### Environment Variables
```bash
# Optional — built-in analysis works without any AI key.
GEMINI_API_KEY=...                          # Google Gemini free tier
GEMINI_MODEL=gemini-3.5-flash
OLLAMA_BASE_URL=http://localhost:11434      # Local Ollama (optional)
OLLAMA_MODEL=llama3.1
OLLAMA_TIMEOUT_MS=180000                    # Slower CPU inference allowance
AI_PROVIDER=gemini                          # gemini | ollama | builtin
```

### Tailwind Customization
```typescript
Extended config includes:
- Custom accent colors
- Backdrop filter utilities
- Glassmorphism color schemes
```

### TypeScript Config
```typescript
Compiler Options:
- ES2020 target
- Strict mode: true
- No unused variables
- No unused parameters
- Module resolution: bundler
```

---

## 🚀 Deployment Architecture

```
Local Development
├─ npm run dev
└─ http://localhost:3000

Production Build
├─ npm run build
└─ Creates .next/ folder

Vercel Deployment
├─ Push to GitHub
├─ Connect Vercel
├─ Set env variables
└─ Auto-deploy on push
```

---

## 📊 Performance Metrics (Target)

```
Lighthouse Scores (Ideal):
├─ Performance: 90+
├─ Accessibility: 95+
├─ Best Practices: 95+
└─ SEO: 100

Load Times:
├─ First Contentful Paint (FCP): < 2s
├─ Largest Contentful Paint (LCP): < 3s
├─ Cumulative Layout Shift (CLS): < 0.1
└─ Time to Interactive (TTI): < 4s
```

---

## 🔐 Security Architecture

```
Client-Side Protection:
├─ XSS Prevention (React built-in)
├─ Input validation
├─ Output sanitization
└─ Safe dependency management

Server-Side Protection:
├─ CORS headers configured
├─ Input validation on API
├─ Type checking with TypeScript
└─ Error message sanitization

Data Protection:
├─ HTTPS enforced (Vercel)
├─ No sensitive data in code
├─ API keys in .env.local
└─ Stateless operations
```

---

## 🎯 State Management

```
Local Component State:
├─ Page.tsx
│  ├─ selectedStock: string | null
│  ├─ analysisData: AnalysisData | null
│  ├─ isLoading: boolean
│  └─ error: string | null
│
└─ StockChart.tsx
   ├─ period: "1d" | "1w" | "1m" | "1y" | "5y"
   ├─ mode: "area" | "candles" | "volume" | "return"
   ├─ showSMA: boolean
   ├─ chartData: ChartData[] (60-second Yahoo refresh)
   ├─ isFetching / showOverlay
   └─ error: string | null

Context/Global State:
└─ None (kept simple)
```

---

## 🧪 Testing Strategy (Ready for Implementation)

```
Unit Tests:
├─ lib/stocks.ts (data parsing)
├─ lib/ai.ts (analysis logic)
└─ lib/scoring.ts (score calculation)

Component Tests:
├─ StockSearch (input handling)
├─ StockCard (data display)
├─ StockChart (chart rendering)
├─ AIScoreGauge (score visualization)
└─ AnalysisPanels (panel rendering)

Integration Tests:
└─ /api/analyze (full flow)

E2E Tests:
└─ Complete user journey
```

---

## 📈 Scalability Considerations

```
Future Improvements:
├─ Database for stock history
├─ User authentication
├─ Watchlist persistence
├─ Portfolio tracking
├─ Alert system
├─ Comparison mode
├─ Advanced filters
└─ Mobile app
```

---

**This architecture ensures a scalable, maintainable, and production-ready application.** 🚀
