# 🚀 AI Indian Stock Analyzer - Complete Setup & Feature Guide

## ✨ What Was Built

A **production-ready web application** that analyzes Indian stocks using AI (Claude 3.5 Sonnet) with real-time data, interactive charts, and intelligent recommendations. Perfect for traders and investors who want AI-powered insights.

---

## 📋 Quick Start

### Windows Setup
```bash
# Run the setup script
setup.bat

# Then run development server
npm run dev
```

### Mac/Linux Setup
```bash
# Make script executable
chmod +x setup.sh

# Run the setup script
./setup.sh

# Then run development server
npm run dev
```

### Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.local.example .env.local

# 3. Edit .env.local and add your API keys
# (Open the file and add: ANTHROPIC_API_KEY=sk-ant-...)

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

---

## 🔑 Getting API Keys

### Anthropic API Key (Required)

1. Go to [https://console.anthropic.com](https://console.anthropic.com)
2. Sign up/Log in
3. Create a new API key
4. Copy the key starting with `sk-ant-`
5. Paste it in `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

---

## 🎯 How to Use

### 1. **Search for a Stock**
   - Type stock name (e.g., "TCS", "RELIANCE")
   - Or ticker symbol (e.g., "TCS.NS")
   - Select from autocomplete suggestions

### 2. **View Real-Time Data**
   - See current price
   - Price change and percentage
   - Market cap and volume
   - 52-week high/low
   - P/E ratio and EPS

### 3. **Analyze Price Charts**
   - View price history
   - Toggle between timeframes:
     - **1D** - Last day (hourly data)
     - **1W** - Last 5 days (hourly data)
     - **1M** - Last month (daily data)
     - **1Y** - Last year (weekly data)
     - **5Y** - Last 5 years (monthly data)
   - Hover over chart for tooltips
   - Smooth zoom and pan animations

### 4. **Get AI Analysis**
   
   **Four Key Metrics:**
   - 🏢 **Fundamentals** (40 points) - Earnings, growth, valuation
   - 📈 **Technical** (30 points) - Momentum, trends, patterns
   - 💬 **Sentiment** (20 points) - Market mood and trends
   - ⚠️ **Risk** (10 points inverse) - Volatility and concerns

### 5. **Read the Score & Recommendation**
   
   **Score Gauge (0-100):**
   - 🟢 **71-100: BUY** - Strong buy signal
   - 🟡 **41-70: HOLD** - Monitor for opportunities
   - 🔴 **0-40: AVOID** - Consider better options

### 6. **Review Detailed Insights**
   - Key highlights and opportunities
   - Risk factors and warnings
   - Detailed reasoning for each metric

---

## 🏗️ Project Architecture

### Frontend Components

```
StockSearch.tsx
├─ Autocomplete suggestions
├─ Search validation
└─ Symbol formatting

StockCard.tsx
├─ Current price display
├─ Live metrics (change, volume, cap)
├─ Historical data (52W high/low)
└─ P/E and EPS

StockChart.tsx
├─ Line chart with gradient fill
├─ Multi-timeframe switching
├─ Interactive tooltips
├─ Responsive sizing
└─ Smooth animations

AIScoreGauge.tsx
├─ Circular progress visualization
├─ Animated gauge needle
├─ Color-coded zones
└─ Pulse effect on score

RecommendationBadge.tsx
├─ Large recommendation display
├─ Color-coded (green/yellow/red)
├─ Score display
└─ Description text

AnalysisPanels.tsx
├─ FundamentalsPanel
├─ TechnicalPanel
├─ SentimentPanel
└─ RiskPanel
```

### Backend Routes

```
/api/analyze (POST)
├─ Receives: { symbol: string }
├─ Validates: Indian stock check
├─ Fetches: Real-time data + history
├─ Analyzes: AI processing
├─ Returns: Complete analysis JSON
└─ Error handling: Graceful fallbacks
```

### Data Flow

```
User Input
    ↓
Search Autocomplete
    ↓
API /analyze
    ↓
Yahoo Finance API (fetch data)
    ↓
Claude AI (analyze data)
    ↓
Scoring Engine (calculate score)
    ↓
Display Results
```

---

## 📊 Supported Indian Stocks (30+)

### **IT & Tech**
- TCS (Tata Consultancy Services)
- Infosys
- Wipro
- HCL Technologies

### **Banking & Finance**
- HDFC Bank
- ICICI Bank
- State Bank of India (SBI)
- Axis Bank
- Bajaj Finserv

### **Auto & Manufacturing**
- Maruti Suzuki
- Bajaj Auto
- Hero MotoCorp
- Tata Steel

### **Energy & Infrastructure**
- Reliance Industries
- NTPC
- Power Grid Corporation
- Coal India

### **FMCG & Consumer**
- Hindustan Unilever
- Nestlé India
- ITC
- Britannia
- Asian Paints

### **Pharma & Healthcare**
- Sun Pharmaceutical
- Cipla
- Dr. Reddy's Laboratories

### **Ports & Logistics**
- Adani Ports
- Container Corporation of India

---

## 🧠 AI Analysis System

### How Claude Analyzes Stocks

1. **Collects Data**
   - Current price and changes
   - Historical price trends
   - Market metrics (cap, volume, P/E)

2. **Processes Information**
   - 20 & 50-day moving averages
   - Price momentum calculation
   - Trend analysis

3. **Generates Analysis**
   - Reviews fundamentals (earnings, valuations)
   - Assesses technical signals
   - Evaluates market sentiment
   - Identifies key risks

4. **Creates Structured Output**
   ```json
   {
     "fundamentalsScore": 75,
     "technicalScore": 70,
     "sentimentScore": 65,
     "riskScore": 30,
     "recommendation": "BUY",
     "reasoning": "..."
   }
   ```

5. **Calculates Final Score**
   - Overall = (Fundamentals × 0.4) + (Technicals × 0.3) + (Sentiment × 0.2) + ((100 - Risk) × 0.1)
   - Clamps between 0-100

### Scoring Weights

| Factor | Weight | Impact |
|--------|--------|--------|
| Fundamentals | 40% | Company health & valuation |
| Technicals | 30% | Price trends & momentum |
| Sentiment | 20% | Market mood & trends |
| Risk | 10% | Volatility & downside |

---

## 🎨 Design Features

### Visual Design
- **Dark Theme** - Easy on the eyes with accent colors
- **Glassmorphism** - Semi-transparent frosted glass effect
- **Smooth Animations** - Framer Motion for elegant transitions
- **Responsive Layout** - Mobile-first grid system
- **Premium Feel** - Like Zerodha, Groww, or other fintech apps

### Interactive Elements
- Hover effects on cards
- Smooth transitions between screens
- Animated gauges and progress bars
- Loading spinners
- Toast notifications
- Keyboard navigation support

---

## 🔒 Error Handling

### Graceful Failure Scenarios

1. **Invalid Stock Symbol**
   ```
   Error: "Only Indian stocks (NSE/BSE) are supported"
   ```

2. **API Unavailable**
   ```
   Error: "Unable to fetch stock data. Please try again."
   Returns: Mock data for demo
   ```

3. **Network Issues**
   ```
   Error: "An error occurred while analyzing the stock"
   Fallback: Default analysis with safe values
   ```

### Validation
- Stock symbol validation against NSE/BSE list
- API response validation
- Data type checking
- Bounds checking on scores

---

## 📱 Responsive Design

### Mobile (320px - 640px)
- Single column layout
- Touch-optimized buttons
- Readable text sizes
- Vertical scrolling

### Tablet (641px - 1024px)
- 2-column grid
- Balanced spacing
- Optimized charts

### Desktop (1025px+)
- 3+ column grid
- Spacious layout
- Full-featured charts

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Vercel
# - Go to vercel.com
# - Click "New Project"
# - Import GitHub repo
# - Select this project

# 3. Add Environment Variable
# - Settings → Environment Variables
# - Add: ANTHROPIC_API_KEY = sk-ant-...

# 4. Deploy!
# Vercel will automatically deploy
```

### Deploy to Other Platforms

```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker build -t stock-analyzer .
docker run -e ANTHROPIC_API_KEY=sk-ant-... stock-analyzer
```

### Build Output
```
.next/          # Optimized Next.js build
public/         # Static assets
```

---

## 🔧 Troubleshooting

### Issue: "Cannot find module '@anthropic-ai/sdk'"

**Solution:**
```bash
npm install @anthropic-ai/sdk
# or
npm ci  # Clean install
```

### Issue: "ANTHROPIC_API_KEY is undefined"

**Solution:**
1. Check `.env.local` exists
2. Verify it has: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart dev server: `npm run dev`

### Issue: "Stock not found" for valid Indian stock

**Solution:**
1. Use NSE symbol format: Add `.NS` suffix
2. E.g., use "TCS.NS" instead of "TCS"
3. Try uppercase: "RELIANCE.NS"

### Issue: Slow page loading

**Solution:**
1. Check internet speed
2. Disable browser extensions
3. Clear browser cache: `Ctrl+Shift+Delete`
4. Try incognito/private mode

### Issue: Charts not displaying

**Solution:**
1. Check if stock data fetched successfully
2. Verify Recharts installed: `npm ls recharts`
3. Check browser console for errors

---

## 📊 Featured Stocks for Testing

Great stocks to test and analyze:

1. **TCS** - Stable IT company, good entry point for AI analysis
2. **RELIANCE** - Large-cap, plenty of data
3. **INFY** - Classic IT stock, good trends
4. **HDFCBANK** - Stable banking, interesting metrics
5. **MARUTI** - Auto sector, volatile for testing risk
6. **NESTLEIND** - FMCG, stable fundamentals

---

## 🎓 Learning Resources

### Understanding Stock Analysis
- P/E Ratio: Company valuation metric
- Market Cap: Total company worth
- Volume: Trading activity levels
- Moving Averages: Price trend indicator
- Risk: Volatility and downside potential

### AI & Claude
- Prompt engineering for analysis
- JSON response parsing
- Error handling and fallbacks

### Web Technologies
- Next.js App Router
- React Hooks and State
- Tailwind CSS utilities
- Framer Motion animations

---

## 📝 Configuration Files

### `next.config.js`
- CORS headers setup
- API route configuration
- Optimization settings

### `tailwind.config.ts`
- Custom color scheme
- Backdrop filter for glassmorphism
- Theme extensions

### `tsconfig.json`
- TypeScript strict mode
- Path aliases (@/lib, @/components)
- ES2020 target

### `.env.local`
- Runtime environment variables
- API keys (don't commit this!)
- Configuration settings

---

## 🎯 Performance Tips

1. **Optimize Images**
   - Use WebP format
   - Compress PNG/JPG
   - Lazy load images

2. **Code Splitting**
   - Already handled by Next.js
   - Dynamic imports for components
   - Route-based code splitting

3. **Caching**
   - Browser cache with proper headers
   - API response caching
   - CDN integration via Vercel

4. **Monitoring**
   - Vercel Analytics
   - Error tracking
   - Performance metrics

---

## 🔐 Security Best Practices

1. **API Keys**
   - Never commit `.env.local`
   - Use `.gitignore` to exclude
   - Rotate keys regularly

2. **Input Validation**
   - Stock symbol validation
   - Data type checking
   - XSS prevention (React automatic)

3. **HTTPS**
   - Always use HTTPS in production
   - Vercel provides automatic HTTPS

4. **Rate Limiting**
   - Implement on production API
   - Prevent abuse and DOS

---

## 🎉 What's Next?

### Future Enhancement Ideas

- [ ] **Compare Stocks** - Side-by-side analysis
- [ ] **Watchlist** - Save favorite stocks
- [ ] **Alerts** - Price & recommendation alerts
- [ ] **Portfolio** - Track holdings
- [ ] **Export Reports** - PDF/Excel analysis
- [ ] **Dark/Light Toggle** - Theme switcher
- [ ] **Advanced Mode** - More detailed metrics
- [ ] **Historical Scores** - Track analysis over time
- [ ] **Social Features** - Share analysis
- [ ] **Mobile App** - React Native version

---

## 📞 Support & Contact

### Getting Help
1. Check README.md
2. Review this setup guide
3. Check GitHub Issues
4. Review code comments

### Reporting Bugs
- Clear description
- Steps to reproduce
- Screenshots/videos
- Error messages
- Environment details

---

## 📄 License & Credits

- **Framework**: Next.js
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **AI**: Anthropic Claude
- **Data**: Yahoo Finance
- **Icons**: Lucide React

---

## 🏆 Awards & Recognition

Built as a premium fintech product with:
- ✅ Production-quality code
- ✅ Professional UI/UX
- ✅ Comprehensive documentation
- ✅ Error handling
- ✅ Performance optimization
- ✅ Security best practices

---

**Enjoy analyzing Indian stocks with AI! 📈**
