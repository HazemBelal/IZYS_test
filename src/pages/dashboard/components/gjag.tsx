const getWidgetDefinitions = (symbol: string, category: string): WidgetDefinition[] => {
  const effectiveCategory = category === "bonds" ? "stocks" : category || "stocks";
  
  if (!symbol) return [];
  
  switch (effectiveCategory) {
    case "stocks":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: "100%",
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
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
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "fundamental-data",
          name: "Fundamental Data",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
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
          default: { x: 0, y: 1150, width: 960, height: 490 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
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
          default: { x: 0, y: 1660, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
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
          default: { x: 480, y: 1660, width: 460, height: 425 }
        }
      ];
    case "crypto":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: "100%",
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
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
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
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
          default: { x: 0, y: 1150, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
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
          default: { x: 480, y: 1150, width: 460, height: 425 }
        },
        {
          id: "crypto-coins-heatmap",
          name: "Coins Heatmap",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 0, y: 1600, width: 460, height: 400 }
        },
        {
          id: "cryptocurrency-market",
          name: "Crypto Market",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-cryptocurrency-market.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 480, y: 1600, width: 460, height: 400 }
        }
      ];
    case "forex":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: "100%",
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
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
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
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
          default: { x: 0, y: 1150, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
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
          default: { x: 480, y: 1150, width: 460, height: 425 }
        },
        {
          id: "economic-calendar",
          name: "Economic Calendar",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 0, y: 1600, width: 960, height: 150 }
        },
        {
          id: "forex-cross-rates",
          name: "Forex Cross Rates",
          scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
          config: {
            width: "100%",
            height: "100%",
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 0, y: 1770, width: 960, height: 400 }
        }
      ];
    default:
      return [];
  }