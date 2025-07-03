import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import { useWidgetVisibility } from "./WidgetVisibilityContext";
import { useDashboardWidgets } from "../../../context/DashboardWidgetsContext";

interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// interface WidgetDefinition {
//   id: string;
//   name: string;
//   scriptSrc: string;
//   config: Record<string, any>;
//   default: WidgetPosition;
// }

interface DashboardWidgetState {
  id: string | number;
  position: WidgetPosition;
  scriptSrc: string;
  config: Record<string, any>;
  name: string;
  widgetType: string;
}

const clearUserCache = async () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

// const getWidgetDefinitions = (symbol: string, category: string): WidgetDefinition[] => {
//   const effectiveCategory = category === "bonds" ? "stocks" : category || "stocks";
  
//   if (!symbol) return [];
  
//   switch (effectiveCategory) {
//     case "stocks":
//       return [
//         {
//           id: "symbol-info",
//           name: "Symbol Info",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
//           config: {
//             symbol: symbol,
//             width: "100%",
//             locale: "en",
//             colorTheme: "light",
//             isTransparent: true,
//           },
//           default: { x: 0, y: 0, width: 960, height: 200 }
//         },
//         {
//           id: "advanced-chart",
//           name: "Advanced Chart",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
//           config: {
//             autosize: true,
//             symbol: symbol,
//             interval: "D",
//             timezone: "Etc/UTC",
//             theme: "light",
//             style: "1",
//             locale: "en",
//             allow_symbol_change: true,
//             calendar: false,
//             support_host: "https://www.tradingview.com",
//           },
//           default: { x: 0, y: 220, width: 960, height: 500 }
//         },
//         {
//           id: "company-profile",
//           name: "Company Profile",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             symbol: symbol,
//             locale: "en",
//           },
//           default: { x: 0, y: 740, width: 960, height: 390 }
//         },
//         {
//           id: "fundamental-data",
//           name: "Fundamental Data",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
//           config: {
//             colorTheme: "light",
//             isTransparent: true,
//             largeChartUrl: "",
//             displayMode: "adaptive",
//             width: "100%",
//             height: "100%",
//             symbol: symbol,
//             locale: "en",
//           },
//           default: { x: 0, y: 1150, width: 960, height: 490 }
//         },
//         {
//           id: "technical-analysis",
//           name: "Technical Analysis",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
//           config: {
//             interval: "15m",
//             width: "100%",
//             isTransparent: true,
//             height: "100%",
//             symbol: symbol,
//             showIntervalTabs: true,
//             displayMode: "single",
//             locale: "en",
//             colorTheme: "light",
//           },
//           default: { x: 0, y: 1660, width: 460, height: 425 }
//         },
//         {
//           id: "top-stories",
//           name: "Top Stories",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
//           config: {
//             feedMode: "symbol",
//             symbol: symbol,
//             colorTheme: "light",
//             isTransparent: true,
//             displayMode: "regular",
//             width: "100%",
//             height: "100%",
//             locale: "en",
//           },
//           default: { x: 480, y: 1660, width: 460, height: 425 }
//         }
//       ];
//     case "crypto":
//       return [
//         {
//           id: "symbol-info",
//           name: "Symbol Info",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
//           config: {
//             symbol: symbol,
//             width: "100%",
//             locale: "en",
//             colorTheme: "light",
//             isTransparent: true,
//           },
//           default: { x: 0, y: 0, width: 960, height: 200 }
//         },
//         {
//           id: "advanced-chart",
//           name: "Advanced Chart",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
//           config: {
//             autosize: true,
//             symbol: symbol,
//             interval: "D",
//             timezone: "Etc/UTC",
//             theme: "light",
//             style: "1",
//             locale: "en",
//             allow_symbol_change: true,
//             calendar: false,
//             support_host: "https://www.tradingview.com",
//           },
//           default: { x: 0, y: 220, width: 960, height: 500 }
//         },
//         {
//           id: "company-profile",
//           name: "Company Profile",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             symbol: symbol,
//             locale: "en",
//           },
//           default: { x: 0, y: 740, width: 960, height: 390 }
//         },
//         {
//           id: "technical-analysis",
//           name: "Technical Analysis",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
//           config: {
//             interval: "15m",
//             width: "100%",
//             isTransparent: true,
//             height: "100%",
//             symbol: symbol,
//             showIntervalTabs: true,
//             displayMode: "single",
//             locale: "en",
//             colorTheme: "light",
//           },
//           default: { x: 0, y: 1150, width: 460, height: 425 }
//         },
//         {
//           id: "top-stories",
//           name: "Top Stories",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
//           config: {
//             feedMode: "symbol",
//             symbol: symbol,
//             colorTheme: "light",
//             isTransparent: true,
//             displayMode: "regular",
//             width: "100%",
//             height: "100%",
//             locale: "en",
//           },
//           default: { x: 480, y: 1150, width: 460, height: 425 }
//         },
//         {
//           id: "crypto-coins-heatmap",
//           name: "Coins Heatmap",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             locale: "en",
//           },
//           default: { x: 0, y: 1600, width: 460, height: 400 }
//         },
//         {
//           id: "cryptocurrency-market",
//           name: "Crypto Market",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-cryptocurrency-market.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             locale: "en",
//           },
//           default: { x: 480, y: 1600, width: 460, height: 400 }
//         }
//       ];
//     case "forex":
//       return [
//         {
//           id: "symbol-info",
//           name: "Symbol Info",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
//           config: {
//             symbol: symbol,
//             width: "100%",
//             locale: "en",
//             colorTheme: "light",
//             isTransparent: true,
//           },
//           default: { x: 0, y: 0, width: 960, height: 200 }
//         },
//         {
//           id: "advanced-chart",
//           name: "Advanced Chart",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
//           config: {
//             autosize: true,
//             symbol: symbol,
//             interval: "D",
//             timezone: "Etc/UTC",
//             theme: "light",
//             style: "1",
//             locale: "en",
//             allow_symbol_change: true,
//             calendar: false,
//             support_host: "https://www.tradingview.com",
//           },
//           default: { x: 0, y: 220, width: 960, height: 500 }
//         },
//         {
//           id: "company-profile",
//           name: "Company Profile",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             symbol: symbol,
//             locale: "en",
//           },
//           default: { x: 0, y: 740, width: 960, height: 390 }
//         },
//         {
//           id: "technical-analysis",
//           name: "Technical Analysis",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
//           config: {
//             interval: "15m",
//             width: "100%",
//             isTransparent: true,
//             height: "100%",
//             symbol: symbol,
//             showIntervalTabs: true,
//             displayMode: "single",
//             locale: "en",
//             colorTheme: "light",
//           },
//           default: { x: 0, y: 1150, width: 460, height: 425 }
//         },
//         {
//           id: "top-stories",
//           name: "Top Stories",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
//           config: {
//             feedMode: "symbol",
//             symbol: symbol,
//             colorTheme: "light",
//             isTransparent: true,
//             displayMode: "regular",
//             width: "100%",
//             height: "100%",
//             locale: "en",
//           },
//           default: { x: 480, y: 1150, width: 460, height: 425 }
//         },
//         {
//           id: "economic-calendar",
//           name: "Economic Calendar",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             locale: "en",
//           },
//           default: { x: 0, y: 1600, width: 960, height: 150 }
//         },
//         {
//           id: "forex-cross-rates",
//           name: "Forex Cross Rates",
//           scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
//           config: {
//             width: "100%",
//             height: "100%",
//             colorTheme: "light",
//             isTransparent: true,
//             locale: "en",
//           },
//           default: { x: 0, y: 1770, width: 960, height: 400 }
//         }
//       ];
//     default:
//       return [];
//   }
// };

const DashboardWidget: React.FC = () => {
  const { widgets, updateWidgetPosition, removeWidget, clearAllWidgets } = useDashboardWidgets();
  const { symbol } = useParams<{ symbol: string; category: string }>();
  const { widgetVisibility } = useWidgetVisibility();
  const [isClearingDashboard, setIsClearingDashboard] = useState(false);
  const [clearStatus, setClearStatus] = useState<string | null>(null);

  // Remove all widgets for the current user
  const handleClearDashboard = async () => {
    setIsClearingDashboard(true);
    setClearStatus(null);
    try {
      const success = await clearAllWidgets();
      setClearStatus(success ? 'Dashboard cleared!' : 'Failed to clear dashboard');
    } catch (err) {
      setClearStatus('Failed to clear dashboard');
    } finally {
      setIsClearingDashboard(false);
    }
  };

  // Always show the Clear Only button, even if there are no widgets
  const clearButton = (
    <div className="absolute top-4 right-4 z-50">
      <button
        onClick={handleClearDashboard}
        disabled={isClearingDashboard || widgets.length === 0}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
      >
        {isClearingDashboard ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Clearing...
          </>
        ) : (
          'Clear Dashboard'
        )}
      </button>
      {clearStatus && (
        <div className={`mt-1 text-xs ${clearStatus.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
          {clearStatus}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    const scriptElements: HTMLScriptElement[] = [];
    const widgetContainers: HTMLElement[] = [];

    const loadWidget = (widget: DashboardWidgetState) => {
      try {
        const container = document.getElementById(widget.id as string);
        if (!container) return;

        widgetContainers.push(container);
        
        // Only clear if the widget content hasn't been loaded yet
        if (!container.hasChildNodes()) {
          container.innerHTML = '';
        }

        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = widget.scriptSrc;
        script.dataset.widgetId = String(widget.id);
        script.innerHTML = JSON.stringify({
          ...widget.config,
          symbol: widget.config.symbol || symbol,
          colorTheme: "light",
          locale: "en"
        });
        
        script.onerror = () => {
          container.innerHTML = `
            <div class="p-2 text-red-500 text-sm">
              Failed to load widget. 
              <button 
                onclick="location.reload()" 
                class="text-blue-500 underline ml-1"
              >
                Retry
              </button>
            </div>
          `;
        };

        // Only append if not already present
        if (!container.querySelector(`script[src="${widget.scriptSrc}"]`)) {
          container.appendChild(script);
          scriptElements.push(script);
        }
      } catch (error) {
        console.error(`Error loading widget ${widget.id}:`, error);
      }
    };

    const timer = setTimeout(() => {
      widgets.forEach(widget => {
        if (widgetVisibility[widget.widgetType] !== false) {
          loadWidget(widget);
        }
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      scriptElements.forEach(script => script.parentNode?.removeChild(script));
      widgetContainers.forEach(container => container.innerHTML = '');
    };
  }, [widgets, widgetVisibility, symbol]);

  if (widgets.length === 0) {
    return (
      <div className="relative w-full h-full bg-gray-100 min-h-screen">
        {clearButton}
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No widgets to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-100 min-h-screen">
      {clearButton}
      {/* Widgets */}
      {widgets
        .filter(widget => widgetVisibility[widget.widgetType] !== false)
        .map((widget) => (
          <Rnd
            key={widget.id as string | number}
            default={widget.position}
            position={{ x: widget.position.x, y: widget.position.y }}
            size={{ width: widget.position.width, height: widget.position.height }}
            minWidth={200}
            minHeight={150}
            onDragStop={(_, d) => {
              updateWidgetPosition(widget.id, {
                ...widget.position,
                x: d.x,
                y: d.y
              });
            }}
            onResizeStop={(_, __, ref, ___, position) => {
              updateWidgetPosition(widget.id, {
                x: position.x,
                y: position.y,
                width: parseInt(ref.style.width),
                height: parseInt(ref.style.height)
              });
            }}
            bounds="parent"
            enableResizing={{
              bottom: true,
              right: true,
              bottomRight: true
            }}
            disableDragging={false}
            dragHandleClassName="drag-handle"
            style={{ 
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
              overflow: "hidden",
              zIndex: 10 
            }}
          >
            <div className="relative w-full h-full">
              <div className="drag-handle absolute top-0 left-0 right-0 h-8 bg-gray-100 hover:bg-gray-200 cursor-move flex items-center justify-center">
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1 h-1 rounded-full bg-gray-400"></div>
                  ))}
                </div>
                <span className="ml-2 text-xs text-gray-600 truncate max-w-xs">
                  {widget.name}
                </span>
              </div>

              <button
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removeWidget(widget.id as string | number);
                }}
                aria-label={`Remove ${widget.name} widget`}
              >
                ×
              </button>

              <div className="absolute top-8 bottom-0 left-0 right-0">
                <div
                  id={String(widget.id)}
                  className="w-full h-full bg-white"
                />
                {!document.getElementById(String(widget.id))?.hasChildNodes() && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
                    <div className="animate-pulse text-gray-500 text-sm">
                      Loading {widget.name}...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Rnd>
        ))}
    </div>
  );
};

export default DashboardWidget;