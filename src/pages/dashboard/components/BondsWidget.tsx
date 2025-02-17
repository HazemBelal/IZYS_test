import React, { useEffect, useRef } from "react";

const BondsWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Remove any existing widget script before adding a new one
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.innerHTML = JSON.stringify({
      "colorTheme": "light",
      "dateRange": "12M",
      "showChart": true,
      "locale": "en",
      "width": "100%",
      "height": "100%",
      "largeChartUrl": "",
      "isTransparent": false,
      "showSymbolLogo": true,
      "showFloatingTooltip": false,
      "plotLineColorGrowing": "rgba(41, 98, 255, 1)",
      "plotLineColorFalling": "rgba(41, 98, 255, 1)",
      "gridLineColor": "rgba(46, 46, 46, 0)",
      "scaleFontColor": "rgba(15, 15, 15, 1)",
      "belowLineFillColorGrowing": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorFalling": "rgba(41, 98, 255, 0.12)",
      "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
      "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
      "symbolActiveColor": "rgba(41, 98, 255, 0.12)",
      "tabs": [
        {
          "title": "Bonds",
          "symbols": [
            { "s": "CBOT:ZB1!", "d": "T-Bond" },
            { "s": "CBOT:UB1!", "d": "Ultra T-Bond" },
            { "s": "EUREX:FGBL1!", "d": "Euro Bund" },
            { "s": "EUREX:FBTP1!", "d": "Euro BTP" },
            { "s": "EUREX:FGBM1!", "d": "Euro BOBL" }
          ],
          "originalTitle": "Bonds"
        }
      ]
    });

    widgetRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-[80vh] bg-white dark:bg-gray-800 p-4 shadow rounded-lg">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Bonds Market Overview</h2>
      <div ref={widgetRef} className="tradingview-widget-container w-full h-full"></div>
    </div>
  );
};

export default BondsWidget;
