// src/pages/dashboard/components/DashboardWidget.tsx
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import { useWidgetVisibility } from "./WidgetVisibilityContext";

interface WidgetDefinition {
  id: string;
  name: string;
  scriptSrc: string;
  config: Record<string, any>;
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
  const effectiveCategory = category ? (category === "bonds" ? "stocks" : category) : "stocks";

  console.log("DashboardWidget params:", { category, symbol, effectiveCategory });

  const { widgetVisibility, setWidgetVisibility } = useWidgetVisibility();

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

  // Initialize widget visibility state if not set
  useEffect(() => {
    const defs = getWidgetDefinitions();
    const initial: Record<string, boolean> = {};
    defs.forEach((w) => {
      if (widgetVisibility[w.id] === undefined) {
        initial[w.id] = true;
      }
    });
    if (Object.keys(initial).length > 0) {
      setWidgetVisibility((prev: Record<string, boolean>) => ({ ...initial, ...prev }));
    }
  }, [symbol, effectiveCategory, setWidgetVisibility, widgetVisibility]);

  // Re-insert widget scripts when parameters or visibility change (only for visible widgets)
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

  const widgetDefs = getWidgetDefinitions();

  // Render draggable and resizable widgets (only visible ones)
  const renderWidgets = () => {
    return widgetDefs
      .filter((w) => widgetVisibility[w.id])
      .map((widget) => (
        <Rnd
          key={widget.id}
          default={widget.default}
          bounds="parent"
          enableResizing
        >
          <div id={widget.id} style={{ width: "100%", height: "100%" }} />
        </Rnd>
      ));
  };

  return <div className="relative h-full w-full">{renderWidgets()}</div>;
};

export default DashboardWidget;
