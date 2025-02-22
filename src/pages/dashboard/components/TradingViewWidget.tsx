import React, { useEffect, useRef } from "react";

const TradingViewWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Clear previous widget content
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-etf-heatmap.js";
    script.innerHTML = JSON.stringify({
      dataSource: "AllUSEtf",
      blockSize: "aum",
      blockColor: "change",
      grouping: "asset_class",
      locale: "en",
      symbolUrl: "",
      colorTheme: "light",
      hasTopBar: true,
      isDataSetEnabled: true,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: "100%",
      height: "90%",
    });

    widgetRef.current.appendChild(script);
  }, []);

  return (
    <div className="w-full h-[75vh] bg-white dark:bg-gray-800 p-1 shadow rounded-lg">
      <div ref={widgetRef} className="tradingview-widget-container w-full h-full"></div>
    </div>
  );
};

export default TradingViewWidget;
