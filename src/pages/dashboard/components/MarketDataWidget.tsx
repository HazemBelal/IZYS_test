import React, { useEffect, useRef } from "react";

interface SymbolGroup {
  name: string;
  symbols: { name: string; displayName?: string }[];
}

interface WidgetConfig {
  title: string;
  title_link: string;
  width: string;
  height: string;
  locale: string;
  showSymbolLogo: boolean;
  symbolsGroups: SymbolGroup[];
  colorTheme: string;
}

interface MarketDataWidgetProps {
  type: "forex" | "crypto" | "bonds" | "etf";
}

const MarketDataWidget: React.FC<MarketDataWidgetProps> = ({ type }) => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  // ✅ Widget Configuration
  const widgetConfig: WidgetConfig = {
    title: "Market Data",
    title_link: "/markets/",
    width: "100%",
    height: "100%",
    locale: "en",
    showSymbolLogo: true,
    symbolsGroups: [],
    colorTheme: "light",
  };

  // ✅ Update widgetConfig based on `type`
  switch (type) {
    case "forex":
      widgetConfig.title = "Forex Market Data";
      widgetConfig.title_link = "/markets/currencies/rates-major/";
      widgetConfig.symbolsGroups = [
        {
          name: "Major",
          symbols: [
            { name: "FX_IDC:EURUSD", displayName: "EUR to USD" },
            { name: "FX_IDC:USDJPY", displayName: "USD to JPY" },
            { name: "FX_IDC:GBPUSD", displayName: "GBP to USD" },
            { name: "FX_IDC:AUDUSD", displayName: "AUD to USD" },
            { name: "FX_IDC:USDCAD", displayName: "USD to CAD" },
            { name: "FX_IDC:USDCHF", displayName: "USD to CHF" },
          ],
        },
        {
          name: "Minor",
          symbols: [
            { name: "FX_IDC:EURGBP", displayName: "EUR to GBP" },
            { name: "FX_IDC:EURJPY", displayName: "EUR to JPY" },
            { name: "FX_IDC:GBPJPY", displayName: "GBP to JPY" },
            { name: "FX_IDC:CADJPY", displayName: "CAD to JPY" },
            { name: "FX_IDC:GBPCAD", displayName: "GBP to CAD" },
            { name: "FX_IDC:EURCAD", displayName: "EUR to CAD" },
          ],
        },
        {
          name: "Exotic",
          symbols: [
            { name: "FX_IDC:USDSEK", displayName: "USD to SEK" },
            { name: "FX_IDC:USDMXN", displayName: "USD to MXN" },
            { name: "FX_IDC:USDZAR", displayName: "USD to ZAR" },
            { name: "FX_IDC:EURTRY", displayName: "EUR to TRY" },
            { name: "FX_IDC:EURNOK", displayName: "EUR to NOK" },
            { name: "FX_IDC:GBPPLN", displayName: "GBP to PLN" },
          ],
        },
      ];
      break;

    case "crypto":
      widgetConfig.title = "Cryptocurrencies";
      widgetConfig.title_link = "/markets/cryptocurrencies/";
      widgetConfig.symbolsGroups = [
        {
          name: "Overview",
          symbols: [
            { name: "CRYPTOCAP:TOTAL" },
            { name: "BITSTAMP:BTCUSD" },
            { name: "BITSTAMP:ETHUSD" },
            { name: "FTX:SOLUSD" },
            { name: "BINANCE:AVAXUSD" },
            { name: "COINBASE:UNIUSD" },
          ],
        },
        {
          name: "Bitcoin",
          symbols: [
            { name: "BITSTAMP:BTCUSD" },
            { name: "COINBASE:BTCEUR" },
            { name: "COINBASE:BTCGBP" },
            { name: "BITFLYER:BTCJPY" },
            { name: "CME:BTC1!" },
          ],
        },
        {
          name: "Ethereum",
          symbols: [
            { name: "BITSTAMP:ETHUSD" },
            { name: "KRAKEN:ETHEUR" },
            { name: "COINBASE:ETHGBP" },
            { name: "BITFLYER:ETHJPY" },
            { name: "BINANCE:ETHBTC" },
            { name: "BINANCE:ETHUSDT" },
          ],
        },
        {
          name: "Solana",
          symbols: [
            { name: "FTX:SOLUSD" },
            { name: "BINANCE:SOLEUR" },
            { name: "COINBASE:SOLGBP" },
            { name: "BINANCE:SOLBTC" },
            { name: "HUOBI:SOLETH" },
            { name: "BINANCE:SOLUSDT" },
          ],
        },
        {
          name: "Uniswap",
          symbols: [
            { name: "COINBASE:UNIUSD" },
            { name: "KRAKEN:UNIEUR" },
            { name: "COINBASE:UNIGBP" },
            { name: "BINANCE:UNIBTC" },
            { name: "KRAKEN:UNIETH" },
            { name: "BINANCE:UNIUSDT" },
          ],
        },
      ];
      break;

    case "bonds":
      widgetConfig.title = "Bonds";
      widgetConfig.title_link = "/markets/bonds/";
      widgetConfig.symbolsGroups = [
        {
          name: "Major Bonds",
          symbols: [
            { name: "TVC:US10Y", displayName: "US 10Y Treasury" },
            { name: "TVC:DE10Y", displayName: "Germany 10Y Bond" },
            { name: "TVC:JP10Y", displayName: "Japan 10Y Bond" },
          ],
        },
      ];
      break;

    case "etf":
      widgetConfig.title = "ETF Market";
      widgetConfig.title_link = "/markets/etfs/";
      widgetConfig.symbolsGroups = [
        {
          name: "Popular ETFs",
          symbols: [
            { name: "AMEX:SPY", displayName: "SPDR S&P 500 ETF" },
            { name: "NASDAQ:QQQ", displayName: "Invesco QQQ ETF" },
            { name: "AMEX:VTI", displayName: "Vanguard Total Stock Market ETF" },
          ],
        },
      ];
      break;

    default:
      break;
  }

  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear previous widget content
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js";
    script.innerHTML = JSON.stringify(widgetConfig);

    widgetRef.current.appendChild(script);
  }, [type]); // Ensures update when `type` changes

  return (
    <div className="w-full h-[75vh] bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{widgetConfig.title}</h2>
      <div ref={widgetRef} className="tradingview-widget-container w-full h-full"></div>
    </div>
  );
};

export default MarketDataWidget;
