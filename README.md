# 📊 AI Indian Stock Analyzer

A production-ready, AI-powered web application for analyzing Indian stocks (NSE/BSE) with real-time data, intelligent recommendations, and beautiful UI.

## 🌟 Features

✅ **Stock Search with Autocomplete** - Search for Indian stocks by name or ticker
✅ **Real-time Price Data** - Live stock prices, volume, P/E ratio, market cap
✅ **Interactive Price Charts** - Multi-timeframe price charts (1D, 1W, 1M, 1Y, 5Y)
✅ **AI-Powered Analysis** - Claude 3.5 Sonnet analysis with:
  - Fundamentals Assessment
  - Technical Analysis
  - Market Sentiment
  - Risk Evaluation
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
- **AI**: Anthropic Claude 3.5 Sonnet
- **Data Sources**: Yahoo Finance API
- **Icons**: Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Anthropic API key (get one at https://console.anthropic.com)

### Setup

1. Clone the repository
```bash
cd "AI stock analyzer"
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file with your API key
```bash
cp .env.local.example .env.local
```

4. Edit `.env.local` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...your_key_here...
```

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
  StockChart.tsx               # Price chart with timeframes
  AIScoreGauge.tsx             # AI score gauge visualization
  RecommendationBadge.tsx      # BUY/HOLD/AVOID badge
  AnalysisPanels.tsx           # Fundamentals, Technical, Sentiment, Risk

/lib
  stocks.ts                    # Yahoo Finance API integration
  ai.ts                        # Claude AI analysis
  scoring.ts                   # Score calculation logic

/public                        # Static assets
```

## 🔌 API Endpoints

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
    "price": 4150.50,
    "change": 125.30,
    "changePercent": 3.11,
    "marketCap": 14500000000000,
    "volume": 5000000
  },
  "chartData": [
    { "date": "2024-03-01", "price": 4000 },
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

The app uses Claude 3.5 Sonnet to analyze stocks based on:

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

## 🔐 Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Anthropic Claude API key

Optional:
- `YAHOO_FINANCE_API_KEY` - For Yahoo Finance paid API access

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add `ANTHROPIC_API_KEY` environment variable
4. Deploy!

### Other Platforms

```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

**Issue**: "Unable to fetch stock data"
- Check internet connection
- Verify stock symbol is correct (should be NSE/BSE listed)
- Yahoo Finance API might be rate-limited

**Issue**: AI analysis fails
- Verify `ANTHROPIC_API_KEY` is set in `.env.local`
- Check API key has available credits
- Verify API key is not expired

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
- AI powered by Anthropic
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
