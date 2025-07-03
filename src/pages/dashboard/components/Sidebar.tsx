import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  IconGraphFilled,
  IconCurrencyBitcoin,
  IconActivity,
  IconComponents,
  IconDeviceHeartMonitorFilled,
  IconCalendar,
  IconNews,
  IconSettings,
  IconX,
  IconSearch,
} from "@tabler/icons-react";
import { useLocation } from "react-router-dom";
import { useDashboardWidgets } from "../../../context/DashboardWidgetsContext";
import { IconAlertCircle } from "@tabler/icons-react";
import debounce from 'lodash.debounce';

interface LinkItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  onMouseEnter?: () => void;
}

interface SidebarProps {
  onShowCalendar: () => void;
  onSymbolSelect?: (symbol: string) => void;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ onShowCalendar, onSymbolSelect }: SidebarProps) => {
  return (
    <SidebarProvider>
      <DesktopSidebar onShowCalendar={onShowCalendar} onSymbolSelect={onSymbolSelect} />
    </SidebarProvider>
  );
};

const sidebarVariants = {
  expanded: {
    width: "280px",
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
  collapsed: {
    width: "80px",
    transition: { type: "spring", stiffness: 100, damping: 20 },
  },
};

const DesktopSidebar = ({
  onShowCalendar,
  
}: {
  onShowCalendar: () => void;
  onSymbolSelect?: (symbol: string) => void;
}) => {
  const { open, setOpen } = useSidebar();
  const navigate = useNavigate();

  // The category user hovered (forex, crypto, etc.)
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  // The symbol user clicked
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state for infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // LoadingMore state for infinite scroll
  const [loadingMore, setLoadingMore] = useState(false);

  // Show searching spinner above the table
  const [searching, setSearching] = useState(false);

  // Add a mapping from sidebar label to API category
  const CATEGORY_LABEL_TO_API: Record<string, string> = {
    Forex: 'forex',
    Crypto: 'crypto',
    Stocks: 'stocks',
    Actions: 'actions',
    Commodities: 'futures', // map Commodities to futures
    Bonds: 'bonds',
    Indices: 'indices',
  };

  // Fetch symbols paginated or search
  const fetchSymbols = useCallback(async (page: number, category: string, query: string) => {
    setLoading(true);
    setError(null);
    let url = "";
    if (query) {
      url = `/api/symbols/search?category=${category}&q=${encodeURIComponent(query)}`;
    } else {
      url = `/api/symbols/paginated?category=${category}&page=${page}&limit=50`;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch symbols");
      const data = await res.json();
      if (query) {
        setSymbols(data.symbols);
        setHasMore(false);
      } else {
        setSymbols(prev => page === 1 ? data.symbols : [...prev, ...data.symbols]);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      setError("Failed to fetch symbols. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Controls the "widget slider" on the right
  const [widgetSliderOpen, setWidgetSliderOpen] = useState(false);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // On hover => fetch first page (reset scroll)
  const handleHover = useCallback((categoryLabel: string) => {
    const apiCategory = CATEGORY_LABEL_TO_API[categoryLabel] || categoryLabel;
    setSelectedMarket(apiCategory);
    setSymbols([]);
    setPage(1);
    setHasMore(true);
    setSearchQuery("");
    fetchSymbols(1, apiCategory, "");
    setTimeout(() => {
      if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
    }, 0);
  }, [fetchSymbols]);

  // On symbol click => open widget slider
  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    // Keep the symbol slider open (do not setSelectedMarket(null) if you want to keep it visible)
    setWidgetSliderOpen(true);
    // Optionally navigate
    if (selectedMarket) {
      navigate(`/dashboard/${selectedMarket}/${symbol}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  // When fetching more symbols (pagination), use selectedMarket as API category
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || loading || loadingMore || searchQuery) return;
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      setLoadingMore(true);
      setTimeout(() => {
        fetchSymbols(page + 1, selectedMarket!, "");
        setPage(p => p + 1);
        setLoadingMore(false);
      }, 1000); // 1 second
    }
  }, [hasMore, loading, loadingMore, searchQuery, fetchSymbols, page, selectedMarket]);

  const debouncedSearch = useRef(
    debounce((value: string, selectedMarket: string) => {
      setSearching(true);
      fetchSymbols(1, selectedMarket, value).then(() => setSearching(false));
    }, 400)
  ).current;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setPage(1);
    if (selectedMarket) {
      debouncedSearch(value, selectedMarket);
    }
  };

  return (
    <motion.div
      className="fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-gray-900 shadow-lg z-50 hidden md:flex flex-col"
      variants={sidebarVariants}
      initial="collapsed"
      animate={open ? "expanded" : "collapsed"}
      onMouseEnter={() => !selectedMarket && setOpen(true)}
      onMouseLeave={() => !selectedMarket && setOpen(false)}
      style={{ overflow: "hidden" }}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Sidebar main content */}
        <div>
          <SidebarContent
            onShowCalendar={onShowCalendar}
            setSelectedMarket={setSelectedMarket}
            onHover={handleHover}
          />
        </div>

        {/* Logout button */}
        <div>
          <div
            className="flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200"
            onClick={handleLogout}
          >
            <IconX />
            {open && <span className="text-sm">Logout</span>}
          </div>
        </div>
      </div>

      {/* Symbol Slider */}
      <AnimatePresence>
        {selectedMarket && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-[64px] left-[280px] h-[calc(100vh-64px)] w-[600px] bg-gray-900 shadow-lg z-50"
          >
            <div className="p-4 h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 text-white">
                <h2 className="text-lg font-bold">{selectedMarket.toUpperCase()}</h2>
                <IconX
                  className="cursor-pointer"
                  onClick={() => setSelectedMarket(null)}
                />
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search symbols..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <IconSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              {loading && (
                <div className="space-y-2">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex justify-between p-2 bg-gray-700 rounded animate-pulse">
                      <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-600 rounded w-1/6"></div>
                    </div>
                  ))}
                </div>
              )}
              {error && <div className="text-red-500 text-center">{error}</div>}
              <div
                ref={tableContainerRef}
                className="overflow-y-auto flex-1 custom-scrollbar"
                onScroll={handleScroll}
                style={{ maxHeight: 'calc(100vh - 200px)' }}
              >
                <table className="w-full text-white">
                  <thead>
                    <tr className="bg-gray-700">
                      <th className="px-4 py-2 text-left font-medium">Symbol</th>
                      <th className="px-4 py-2 text-left font-medium">Description</th>
                      <th className="px-4 py-2 text-left font-medium">Exchange</th>
                    </tr>
                  </thead>
                  <tbody>
                    {symbols.map((symObj) => (
                      <tr
                        key={`${symObj.symbol}-${symObj.exchange}`}
                        className="hover:bg-gray-700 transition-all duration-150 cursor-pointer"
                        onClick={() => handleSymbolSelect(symObj.symbol)}
                      >
                        <td className="px-4 py-2 font-normal">{symObj.symbol}</td>
                        <td className="px-4 py-2 font-normal">{symObj.description}</td>
                        <td className="px-4 py-2 font-normal">{symObj.exchange}</td>
                      </tr>
                    ))}
                    {!loading && !symbols.length && (
                      <tr><td colSpan={3} className="text-center py-2">No symbols found.</td></tr>
                    )}
                    {/* TEMPORARY: Always show spinner for debugging */}
                    <tr>
                      <td colSpan={3} className="text-center py-4">
                        <span className="loader"></span>
                      </td>
                    </tr>
                    {loadingMore && (
                      <tr>
                        <td colSpan={3} style={{ padding: '16px 0' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 40
                          }}>
                            <img
                              src="/spinner.svg"
                              alt="Loading..."
                              style={{
                                width: '8vw',
                                maxWidth: 40,
                                minWidth: 24,
                                height: 'auto',
                                display: 'block',
                                background: 'none'
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                    {searching && (
                      <tr>
                        <td colSpan={3} style={{ padding: '16px 0' }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 32
                          }}>
                            <img
                              src="/spinner.svg"
                              alt="Searching..."
                              style={{
                                width: 24,
                                height: 24,
                                display: 'block',
                                background: 'none'
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Slider => Full screen to the right, so let's do left=880px => width=calc(100vw - 880px) */}
      <AnimatePresence>
        {widgetSliderOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-[64px] left-[880px] h-[calc(100vh-64px)] bg-gray-900 text-white shadow-lg z-50"
            style={{ width: "calc(100vw - 880px)" }}
          >
            <div className="h-full flex flex-col">
              <WidgetTabs
                selectedSymbol={selectedSymbol}
                onClose={() => setWidgetSliderOpen(false)}
                onAddToDashboard={() => {
                  // By default, close the slider
                  setWidgetSliderOpen(false);
                  // If you also want to close the symbol list slider:
                  // setSelectedMarket(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// The "WidgetTabs" component is below. (We export it if you prefer.)
const WidgetTabs: React.FC<{
  selectedSymbol: string | null;
  onClose: () => void;
  onAddToDashboard: () => void;
}> = ({ selectedSymbol, onClose, onAddToDashboard }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const activeCategory = pathParts[2] || "stocks";
  const { addWidget } = useDashboardWidgets();


  // The widget definitions for each category, referencing selectedSymbol.
  // For brevity, we show only stocks/crypto/forex, but you can add more.
  const widgetToggleMapping: Record<string, { id: string; name: string; scriptSrc: string; config: Record<string, any> }[]> = {
    stocks: [
      {
        id: "symbol-info",
        name: "Symbol Info",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "NASDAQ:AAPL",
          width: "100%",
          locale: "en",
          colorTheme: "light",
          isTransparent: true,
        },
      },
      {
        id: "advanced-chart",
        name: "Advanced Chart",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "NASDAQ:AAPL",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          allow_symbol_change: true,
          calendar: false,
          support_host: "https://www.tradingview.com",
        },
      },
      {
        id: "company-profile",
        name: "Company Profile",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          symbol: selectedSymbol || "NASDAQ:AAPL",
          locale: "en",
        },
      },
      {
        id: "fundamental-data",
        name: "Fundamental Data",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
        config: {
          autosize: true,
          colorTheme: "light",
          isTransparent: true,
          largeChartUrl: "",
          displayMode: "adaptive",
          width: "100%",
          height: "100%",
          symbol: selectedSymbol || "NASDAQ:AAPL",
          locale: "en",
        },
      },
      {
        id: "technical-analysis",
        name: "Technical Analysis",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
        config: {
          autosize: true,
          interval: "15m",
          width: "100%",
          isTransparent: true,
          height: "150%",
          symbol: selectedSymbol || "NASDAQ:AAPL",
          showIntervalTabs: true,
          displayMode: "single",
          locale: "en",
          colorTheme: "light",
        },
      },
      {
        id: "top-stories",
        name: "Top Stories",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
        config: {
          autosize: true,
          feedMode: "symbol",
          symbol: selectedSymbol || "NASDAQ:AAPL",
          colorTheme: "light",
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          locale: "en",
        },
      },
    ],
    crypto: [
      {
        id: "symbol-info",
        name: "Symbol Info",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "BTCUSD",
          width: "100%",
          locale: "en",
          colorTheme: "light",
          isTransparent: true,
        },
      },
      {
        id: "advanced-chart",
        name: "Advanced Chart",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "BTCUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          allow_symbol_change: true,
          calendar: false,
          support_host: "https://www.tradingview.com",
        },
      },
      {
        id: "company-profile",
        name: "Company Profile",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          symbol: selectedSymbol || "BTCUSD",
          locale: "en",
        },
      },
      {
        id: "technical-analysis",
        name: "Technical Analysis",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
        config: {
          autosize: true,
          interval: "15m",
          width: "100%",
          isTransparent: true,
          height: "150%",
          symbol: selectedSymbol || "BTCUSD",
          showIntervalTabs: true,
          displayMode: "single",
          locale: "en",
          colorTheme: "light",
        },
      },
      {
        id: "top-stories",
        name: "Top Stories",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
        config: {
          autosize: true,
          feedMode: "symbol",
          symbol: selectedSymbol || "BTCUSD",
          colorTheme: "light",
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          locale: "en",
        },
      },
      {
        id: "crypto-coins-heatmap",
        name: "Coins Heatmap",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          locale: "en",
        },
      },
      {
        id: "cryptocurrency-market",
        name: "Crypto Market",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-cryptocurrency-market.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          locale: "en",
        },
      },
    ],
    forex: [
      {
        id: "symbol-info",
        name: "Symbol Info",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "EURUSD",
          width: "100%",
          locale: "en",
          colorTheme: "light",
          isTransparent: true,
        },
      },
      {
        id: "advanced-chart",
        name: "Advanced Chart",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
        config: {
          autosize: true,
          symbol: selectedSymbol || "EURUSD",
          interval: "D",
          timezone: "Etc/UTC",
          theme: "light",
          style: "1",
          locale: "en",
          allow_symbol_change: true,
          calendar: false,
          support_host: "https://www.tradingview.com",
        },
      },
      {
        id: "company-profile",
        name: "Company Profile",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          symbol: selectedSymbol || "EURUSD",
          locale: "en",
        },
      },
      {
        id: "technical-analysis",
        name: "Technical Analysis",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
        config: {
          autosize: true,
          interval: "15m",
          width: "100%",
          isTransparent: true,
          height: "150%",
          symbol: selectedSymbol || "EURUSD",
          showIntervalTabs: true,
          displayMode: "single",
          locale: "en",
          colorTheme: "light",
        },
      },
      {
        id: "top-stories",
        name: "Top Stories",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
        config: {
          autosize: true,
          feedMode: "symbol",
          symbol: selectedSymbol || "EURUSD",
          colorTheme: "light",
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          locale: "en",
        },
      },
      {
        id: "economic-calendar",
        name: "Economic Calendar",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-economic-calendar.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          locale: "en",
        },
      },
      {
        id: "forex-cross-rates",
        name: "Forex Cross Rates",
        scriptSrc: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
        config: {
          autosize: true,
          width: "100%",
          height: "100%",
          colorTheme: "light",
          isTransparent: true,
          locale: "en",
        },
      },
    ],
  };

  const tabs = widgetToggleMapping[activeCategory] || [];
  const activeTab = tabs[activeTabIndex];
  const activeConfig = activeTab
    ? { scriptSrc: activeTab.scriptSrc, config: activeTab.config }
    : null;

  // We only want to add the single selected widget to the dashboard,
  // clearing old widgets from the prior symbol if user picks a new symbol.
  const handleAddToDashboard = () => {
    if (!activeTab || !selectedSymbol) return;
    
    addWidget({
      widgetType: activeTab.id,
      symbol: selectedSymbol,
      category: activeCategory,
      name: activeTab.name,
      scriptSrc: activeTab.scriptSrc,
      config: { ...activeTab.config, symbol: selectedSymbol },
      position: {
        x: 0,
        y: 0, // Changed from widgets.length * 100 to 0 since we don't have access to widgets here
        width: 400,
        height: 300,
      },
    });
    
    onAddToDashboard();
  };
  


  return (
    <div className="flex flex-col w-full h-full">
      {/* Top row: Tabs + "Add" + "Close" */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        {/* Tab row (make them smaller, e.g. text-xs) */}
        <div className="flex space-x-1">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabIndex(index)}
              className={`px-3 py-1 text-xs font-medium rounded-t-sm ${
                index === activeTabIndex
                  ? "bg-white text-gray-900"
                  : "bg-gray-600 text-white"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button
            className="bg-gray-500 text-white px-2 py-1 text-xs rounded"
            onClick={handleAddToDashboard}
          >
            Add to Dashboard
          </button>
          <button
            className="bg-gray-700 text-white px-2 py-1 text-xs rounded"
            onClick={onClose}
          >
            X
          </button>
        </div>
      </div>

      {/* Widget preview area => fill the remaining height */}
      <div className="flex-1 overflow-auto p-2 bg-gray-800">
        {activeConfig && (
          <WidgetPreview
            scriptSrc={activeConfig.scriptSrc}
            config={activeConfig.config}
          />
        )}
      </div>
    </div>
  );
};

// A simple preview that loads the TradingView script
const WidgetPreview: React.FC<{
  scriptSrc: string;
  config: Record<string, any>;
}> = ({ scriptSrc, config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let script: HTMLScriptElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const loadWidget = () => {
      try {
        // Clear previous content
        container.innerHTML = '';
        setIsLoading(true);
        setError(null);

        // Create new script element
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = scriptSrc;
        
        // Safe config serialization
        try {
          script.innerHTML = JSON.stringify(config);
        } catch (e) {
          console.error('Config serialization error:', e);
          script.innerHTML = '{}';
        }

        // Event handlers
        script.onerror = () => {
          setError('Failed to load widget. Please try again.');
          setIsLoading(false);
        };

        script.onload = () => {
          timeoutId = setTimeout(() => {
            setIsLoading(false);
          }, 300); // Small delay for smoother transition
        };

        container.appendChild(script);
      } catch (err) {
        console.error('Widget loading error:', err);
        setError('Error loading widget');
        setIsLoading(false);
      }
    };

    // Debounce widget loading
    const debounceTimer = setTimeout(loadWidget, 150);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(timeoutId);
      
      if (script && container.contains(script)) {
        container.removeChild(script);
      }
      container.innerHTML = '';
    };
  }, [scriptSrc, config]);

  return (
    <div className="relative w-full h-full bg-white">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-4 z-10">
          <div className="text-red-500 text-center">
            <IconAlertCircle className="mx-auto h-8 w-8" />
            <p className="mt-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
              className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Widget container */}
      <div
        ref={containerRef}
        className={`w-full h-full transition-opacity duration-200 ${
          isLoading ? 'opacity-50' : 'opacity-100'
        }`}
      />
    </div>
  );
};


const SidebarContent = ({
  setSelectedMarket,
  onHover,
}: SidebarProps & {
  onLinkClick?: () => void;
  setSelectedMarket?: (market: string) => void;
  onHover?: (category: string) => void;
}) => {
  const { open } = useSidebar();
  const navigate = useNavigate();

  const sidebarLinks: LinkItem[] = [
    {
      label: "Forex",
      icon: <IconGraphFilled />,
      onClick: () => setSelectedMarket?.("forex"),
      onMouseEnter: () => onHover?.("forex"),
    },
    {
      label: "Crypto",
      icon: <IconCurrencyBitcoin />,
      onClick: () => setSelectedMarket?.("crypto"),
      onMouseEnter: () => onHover?.("crypto"),
    },
    {
      label: "Actions",
      icon: <IconActivity />,
      onClick: () => setSelectedMarket?.("actions"),
      onMouseEnter: () => onHover?.("actions"),
    },
    {
      label: "Commodities",
      icon: <IconComponents />,
      onClick: () => setSelectedMarket?.("futures"),
      onMouseEnter: () => onHover?.("futures"),
    },
    {
      label: "Bonds",
      icon: <IconDeviceHeartMonitorFilled />,
      onClick: () => setSelectedMarket?.("bonds"),
      onMouseEnter: () => onHover?.("bonds"),
    },
    {
      label: "Calendar",
      icon: <IconCalendar />,
      onClick: () => navigate("/calendar"),
    },
    {
      label: "News",
      icon: <IconNews />,
      onClick: () => navigate("/news"),
    },
    {
      label: "Settings",
      icon: <IconSettings />,
      onClick: () => navigate("/settings"),
    },
  ];

  return (
    <div className="flex flex-col h-full text-white space-y-3 p-3">
      {sidebarLinks.map((link) => (
        <div
          key={link.label}
          className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer"
          onClick={link.onClick}
          onMouseEnter={link.onMouseEnter}
        >
          {link.icon}
          {open && <span className="text-sm">{link.label}</span>}
        </div>
      ))}
    </div>
  );
};

export default Sidebar; // or export default Sidebar if you prefer
