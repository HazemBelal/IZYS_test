import React, { useEffect, useRef } from "react";

const NewsWidget: React.FC = () => {
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const loadWidget = () => {
    if (!widgetRef.current) return;

    // Clear existing widget content
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.innerHTML = JSON.stringify({
      feedMode: "all_symbols",
      isTransparent: false,
      displayMode: "adaptive",
      width: "110%",
      height: "600",
      colorTheme: "light",
      locale: "en",
    });

    widgetRef.current.appendChild(script);
  };

  useEffect(() => {
    loadWidget(); // Initial load

    // Refresh the widget every 3 minutes (180,000ms)
    const interval = setInterval(() => {
      loadWidget();
    }, 180000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="w-full h-[550px] bg-white dark:bg-gray-800 p-4 shadow rounded-lg ml-[-15px]">
      
      <div ref={widgetRef} className="tradingview-widget-container w-full h-full"></div>
    </div>
  );
};

export default NewsWidget;
