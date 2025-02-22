import React, { useEffect, useRef } from "react";

const TickerWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Remove any existing script before adding a new one
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500 Index" },
        { proName: "FOREXCOM:NSXUSD", title: "US 100 Cash CFD" },
        { proName: "FX_IDC:EURUSD", title: "EUR to USD" },
        { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
        { proName: "BITSTAMP:ETHUSD", title: "Ethereum" }
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark", // ✅ FIXED: Now matches dark mode
      locale: "en"
    });

    widgetRef.current.appendChild(script);
  }, []);

  return (
    <div className="fixed bottom-0 left-[250px] w-[calc(100%-250px)] bg-gray-100 dark:bg-gray-800 shadow-lg z-50 p-4 rounded-lg"> 
      <div ref={widgetRef} className="tradingview-widget-container w-full"></div>
    </div>
  );
};

export default TickerWidget;
