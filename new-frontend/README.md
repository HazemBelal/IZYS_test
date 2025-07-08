# IZYS Dashboard - New Frontend

A modern, professional trading dashboard built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 Modern dark theme with green accent colors
- 🔐 Secure authentication system
- 📊 Real-time market data widgets
- 📰 News and economic calendar
- 🔍 Advanced symbol search and filtering
- 📱 Responsive design
- ⚡ Fast and optimized with Vite

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on `http://localhost:3001`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
# Create .env file in the root directory
VITE_API_URL=http://localhost:3001/api
```

3. Start development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/       # React contexts (Auth, etc.)
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── utils/         # Utility functions and API
├── App.tsx        # Main app component
├── main.tsx       # App entry point
└── index.css      # Global styles
```

## API Integration

The frontend communicates with your existing backend API. Make sure your backend is running and the API endpoints are available at the configured URL.

## Development

- The app uses TypeScript for type safety
- Tailwind CSS for styling with custom dark theme
- Lucide React for consistent iconography
- React Router for navigation
- Context API for state management

## Contributing

1. Follow the existing code style
2. Use TypeScript for all new components
3. Add proper error handling
4. Test your changes thoroughly

## Widget Categories

The dashboard supports the following trading categories, each with specialized widgets:

### Available Categories

1. **Forex** - Foreign exchange currency pairs
   - Symbol Info, Advanced Chart, Company Profile, Technical Analysis, Top Stories, Economic Calendar, Forex Cross Rates

2. **Crypto** - Cryptocurrencies
   - Symbol Info, Advanced Chart, Company Profile, Technical Analysis, Top Stories, Coins Heatmap, Crypto Market

3. **Stocks** - US stock market
   - Symbol Info, Advanced Chart, Company Profile, Fundamental Data, Technical Analysis, Top Stories

4. **Futures** - Futures contracts
   - Symbol Info, Advanced Chart, Technical Analysis, Top Stories, Economic Calendar

5. **Bonds** - Government and corporate bonds
   - Symbol Info, Advanced Chart, Technical Analysis, Economic Calendar

6. **ETFs** - Exchange-traded funds
   - Symbol Info, Advanced Chart, ETF Profile, Technical Analysis, Top Stories, ETF Heatmap

7. **Options** - Options contracts
   - Symbol Info, Advanced Chart, Technical Analysis, Top Stories

8. **Indices** - Market indices
   - Symbol Info, Advanced Chart, Technical Analysis, Top Stories, Economic Calendar

### TradingView API Integration

All categories are powered by the TradingView Screener API, which provides real-time market data and technical analysis. The categories map to specific TradingView markets:

- `forex` → TradingView forex market
- `crypto` → TradingView crypto market  
- `stocks` → TradingView america market (US stocks)
- `futures` → TradingView futures market
- `bonds` → TradingView bonds market
- `etfs` → Filtered from TradingView america market
- `options` → TradingView options market
- `indices` → TradingView index market

## Widget Types

Each category supports different widget types optimized for that market:

- **Symbol Info**: Basic price and volume information
- **Advanced Chart**: Interactive TradingView charts with multiple timeframes
- **Technical Analysis**: Automated technical analysis and recommendations
- **Company Profile**: Detailed company/asset information
- **Economic Calendar**: Upcoming economic events and releases
- **News Feed**: Real-time financial news and market updates
- **Market Overview**: Sector-specific market overviews and heatmaps
