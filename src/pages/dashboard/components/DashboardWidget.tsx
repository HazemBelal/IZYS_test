// src/pages/dashboard/components/DashboardWidget.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd";

// Define a type for widget definitions
interface WidgetDefinition {
  id: string;
  name: string;
  scriptSrc: string;
  config: Record<string, any>;
  // default position & size (in pixels)
  default: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const DashboardWidget: React.FC = () => {
  // Expect URL in the format: /dashboard/:category/:symbol
  const { symbol, category } = useParams<{ symbol: string; category: string }>();

  // If category is missing, default to "stocks"
  const effectiveCategory = category ? (category === "bonds" ? "stocks" : category) : "stocks";

  console.log("DashboardWidget params:", { category, symbol, effectiveCategory });

  // Define widget definitions per effective category
  const getWidgetDefinitions = (): WidgetDefinition[] => {
    if (!symbol) return [];
    switch (effectiveCategory) {
      case "stocks":
        return [
          {
            id: "symbol-info",
            name: "Symbol Info",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
            config: {
              symbol: symbol,
              width: "100%",
              locale: "en",
              colorTheme: "light",
              isTransparent: true,
            },
            default: { x: 0, y: 0, width: 600, height: 200 },
          },
          {
            id: "advanced-chart",
            name: "Advanced Chart",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
            config: {
              autosize: true,
              symbol: symbol,
              interval: "D",
              timezone: "Etc/UTC",
              theme: "light",
              style: "1",
              locale: "en",
              allow_symbol_change: true,
              calendar: false,
              support_host: "https://www.tradingview.com",
            },
            default: { x: 0, y: 210, width: 600, height: 500 },
          },
          {
            id: "company-profile",
            name: "Company Profile",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              symbol: symbol,
              locale: "en",
            },
            default: { x: 0, y: 720, width: 600, height: 290 },
          },
          {
            id: "fundamental-data",
            name: "Fundamental Data",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
            config: {
              colorTheme: "light",
              isTransparent: true,
              largeChartUrl: "",
              displayMode: "adaptive",
              width: "100%",
              height: "100%",
              symbol: symbol,
              locale: "en",
            },
            default: { x: 0, y: 1020, width: 600, height: 490 },
          },
          {
            id: "technical-analysis",
            name: "Technical Analysis",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
            config: {
              interval: "15m",
              width: "100%",
              isTransparent: true,
              height: "100%",
              symbol: symbol,
              showIntervalTabs: true,
              displayMode: "single",
              locale: "en",
              colorTheme: "light",
            },
            default: { x: 610, y: 210, width: 600, height: 425 },
          },
          {
            id: "top-stories",
            name: "Top Stories",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
            config: {
              feedMode: "symbol",
              symbol: symbol,
              colorTheme: "light",
              isTransparent: true,
              displayMode: "regular",
              width: "100%",
              height: "100%",
              locale: "en",
            },
            default: { x: 610, y: 640, width: 600, height: 425 },
          },
        ];
      case "crypto":
        return [
          {
            id: "symbol-info",
            name: "Symbol Info",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
            config: {
              symbol: symbol,
              width: "100%",
              locale: "en",
              colorTheme: "light",
              isTransparent: true,
            },
            default: { x: 0, y: 0, width: 600, height: 200 },
          },
          {
            id: "advanced-chart",
            name: "Advanced Chart",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
            config: {
              autosize: true,
              symbol: symbol,
              interval: "D",
              timezone: "Etc/UTC",
              theme: "light",
              style: "1",
              locale: "en",
              allow_symbol_change: true,
              calendar: false,
              support_host: "https://www.tradingview.com",
            },
            default: { x: 0, y: 210, width: 600, height: 500 },
          },
          {
            id: "company-profile",
            name: "Company Profile",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              symbol: symbol,
              locale: "en",
            },
            default: { x: 0, y: 720, width: 600, height: 290 },
          },
          {
            id: "technical-analysis",
            name: "Technical Analysis",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
            config: {
              interval: "15m",
              width: "100%",
              isTransparent: true,
              height: "100%",
              symbol: symbol,
              showIntervalTabs: true,
              displayMode: "single",
              locale: "en",
              colorTheme: "light",
            },
            default: { x: 610, y: 210, width: 600, height: 425 },
          },
          {
            id: "top-stories",
            name: "Top Stories",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
            config: {
              feedMode: "symbol",
              symbol: symbol,
              colorTheme: "light",
              isTransparent: true,
              displayMode: "regular",
              width: "100%",
              height: "100%",
              locale: "en",
            },
            default: { x: 610, y: 640, width: 600, height: 425 },
          },
          {
            id: "crypto-coins-heatmap",
            name: "Coins Heatmap",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              locale: "en",
            },
            default: { x: 0, y: 1020, width: 600, height: 400 },
          },
          {
            id: "cryptocurrency-market",
            name: "Crypto Market",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-cryptocurrency-market.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              locale: "en",
            },
            default: { x: 610, y: 1020, width: 600, height: 400 },
          },
        ];
      case "forex":
        return [
          {
            id: "symbol-info",
            name: "Symbol Info",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
            config: {
              symbol: symbol,
              width: "100%",
              locale: "en",
              colorTheme: "light",
              isTransparent: true,
            },
            default: { x: 0, y: 0, width: 600, height: 200 },
          },
          {
            id: "advanced-chart",
            name: "Advanced Chart",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
            config: {
              autosize: true,
              symbol: symbol,
              interval: "D",
              timezone: "Etc/UTC",
              theme: "light",
              style: "1",
              locale: "en",
              allow_symbol_change: true,
              calendar: false,
              support_host: "https://www.tradingview.com",
            },
            default: { x: 0, y: 210, width: 600, height: 500 },
          },
          {
            id: "company-profile",
            name: "Company Profile",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              symbol: symbol,
              locale: "en",
            },
            default: { x: 0, y: 720, width: 600, height: 290 },
          },
          {
            id: "technical-analysis",
            name: "Technical Analysis",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
            config: {
              interval: "15m",
              width: "100%",
              isTransparent: true,
              height: "100%",
              symbol: symbol,
              showIntervalTabs: true,
              displayMode: "single",
              locale: "en",
              colorTheme: "light",
            },
            default: { x: 610, y: 210, width: 600, height: 425 },
          },
          {
            id: "top-stories",
            name: "Top Stories",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
            config: {
              feedMode: "symbol",
              symbol: symbol,
              colorTheme: "light",
              isTransparent: true,
              displayMode: "regular",
              width: "100%",
              height: "100%",
              locale: "en",
            },
            default: { x: 610, y: 640, width: 600, height: 425 },
          },
          {
            id: "economic-calendar",
            name: "Economic Calendar",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              locale: "en",
            },
            default: { x: 0, y: 1020, width: 600, height: 150 },
          },
          {
            id: "forex-cross-rates",
            name: "Forex Cross Rates",
            scriptSrc:
              "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
            config: {
              width: "100%",
              height: "100%",
              colorTheme: "light",
              isTransparent: true,
              locale: "en",
            },
            default: { x: 0, y: 1180, width: 600, height: 400 },
          },
        ];
      default:
        return [];
    }
  };

  // Widget visibility state (true = shown)
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({});

  // When widget definitions change, initialize visibility to true for each
  useEffect(() => {
    const defs = getWidgetDefinitions();
    const initialVisibility: Record<string, boolean> = {};
    defs.forEach((w) => {
      initialVisibility[w.id] = true;
    });
    setWidgetVisibility(initialVisibility);
  }, [symbol, effectiveCategory]);

  // When any of the parameters or visibility change, re-insert widget scripts for visible widgets
  useEffect(() => {
    const defs = getWidgetDefinitions();
    defs.forEach((widget) => {
      if (widgetVisibility[widget.id]) {
        const container = document.getElementById(widget.id);
        if (container) {
          container.innerHTML = "";
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.async = true;
          script.src = widget.scriptSrc;
          script.text = JSON.stringify(widget.config);
          script.onload = () =>
            console.log(`Widget ${widget.id} loaded successfully`);
          container.appendChild(script);
        }
      }
    });
  }, [symbol, effectiveCategory, widgetVisibility]);

  // Get the widget definitions
  const widgetDefs = getWidgetDefinitions();

  // Render the draggable widgets using react-rnd.
  // Each widget is only rendered if its toggle is on; if off, we render it with opacity 0.3.
  const renderWidgets = () => {
    return widgetDefs.map((widget) => (
      <Rnd
        key={widget.id}
        default={widget.default}
        bounds="parent"
        disableDragging={!widgetVisibility[widget.id]} // disable dragging if toggled off
        style={{ opacity: widgetVisibility[widget.id] ? 1 : 0.3, border: "1px dashed #ccc" }}
      >
        <div id={widget.id} style={{ width: "100%", height: "100%" }} />
      </Rnd>
    ));
  };

  // Render a toggle panel for the widget list at the bottom
  const renderTogglePanel = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 p-2 flex space-x-2 text-xs">
        {widgetDefs.map((widget) => (
          <button
            key={widget.id}
            onClick={() =>
              setWidgetVisibility((prev) => ({
                ...prev,
                [widget.id]: !prev[widget.id],
              }))
            }
            className={`px-2 py-1 rounded ${
              widgetVisibility[widget.id] ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-800"
            }`}
          >
            {widget.name}
          </button>
        ))}
      </div>
    );
  };

  // Layout based on category for now (we position widgets arbitrarily in a relative container)
  // You can adjust the container style as needed.
  return (
    <div className="relative h-full w-full">
      {/* Render the draggable widgets */}
      {renderWidgets()}
      {/* Render the toggle panel at the bottom */}
      {renderTogglePanel()}
    </div>
  );
};

export default DashboardWidget;
