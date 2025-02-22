import React, { useEffect, useRef } from "react";

const CryptoWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear previous widget content
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.innerHTML = JSON.stringify({
      title: "Cryptocurrencies",
      title_raw: "Cryptocurrencies",
      tabs: [
        {
          title: "Overview",
          title_raw: "Overview",
          symbols: [
            { s: "CRYPTOCAP:TOTAL" },
            { s: "BITSTAMP:BTCUSD" },
            { s: "BITSTAMP:ETHUSD" },
            { s: "FTX:SOLUSD" },
            { s: "BINANCE:AVAXUSD" },
            { s: "COINBASE:UNIUSD" }
          ],
          quick_link: { title: "More cryptocurrencies", href: "/markets/cryptocurrencies/prices-all/" }
        },
        {
          title: "Bitcoin",
          title_raw: "Bitcoin",
          symbols: [
            { s: "BITSTAMP:BTCUSD" },
            { s: "COINBASE:BTCEUR" },
            { s: "COINBASE:BTCGBP" },
            { s: "BITFLYER:BTCJPY" },
            { s: "CME:BTC1!" }
          ],
          quick_link: { title: "More Bitcoin pairs", href: "/symbols/BTCUSD/markets/" }
        },
        {
          title: "Ethereum",
          title_raw: "Ethereum",
          symbols: [
            { s: "BITSTAMP:ETHUSD" },
            { s: "KRAKEN:ETHEUR" },
            { s: "COINBASE:ETHGBP" },
            { s: "BITFLYER:ETHJPY" },
            { s: "BINANCE:ETHBTC" },
            { s: "BINANCE:ETHUSDT" }
          ],
          quick_link: { title: "More Ethereum pairs", href: "/symbols/ETHUSD/markets/" }
        },
        {
          title: "Solana",
          title_raw: "Solana",
          symbols: [
            { s: "FTX:SOLUSD" },
            { s: "BINANCE:SOLEUR" },
            { s: "COINBASE:SOLGBP" },
            { s: "BINANCE:SOLBTC" },
            { s: "HUOBI:SOLETH" },
            { s: "BINANCE:SOLUSDT" }
          ],
          quick_link: { title: "More Solana pairs", href: "/symbols/SOLUSD/markets/" }
        },
        {
          title: "Uniswap",
          title_raw: "Uniswap",
          symbols: [
            { s: "COINBASE:UNIUSD" },
            { s: "KRAKEN:UNIEUR" },
            { s: "COINBASE:UNIGBP" },
            { s: "BINANCE:UNIBTC" },
            { s: "KRAKEN:UNIETH" },
            { s: "BINANCE:UNIUSDT" }
          ],
          quick_link: { title: "More Uniswap pairs", href: "/symbols/UNIUSD/markets/" }
        }
      ],
      title_link: "/markets/cryptocurrencies/prices-all/",
      width: "100%",
      height: "100%",
      showChart: true,
      showFloatingTooltip: false,
      locale: "en",
      plotLineColorGrowing: "#2962FF",
      plotLineColorFalling: "#2962FF",
      belowLineFillColorGrowing: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorFalling: "rgba(41, 98, 255, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(41, 98, 255, 0)",
      belowLineFillColorFallingBottom: "rgba(41, 98, 255, 0)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "rgba(120, 123, 134, 1)",
      showSymbolLogo: true,
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      colorTheme: "light"
    });

    widgetRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-[75vh] bg-white dark:bg-gray-800 p-1 shadow rounded-lg">

      <div ref={widgetRef} className="tradingview-widget-container w-full h-full"></div>
    </div>
  );
};

export default CryptoWidget;
