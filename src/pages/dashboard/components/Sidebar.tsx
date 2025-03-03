import React, { useState, createContext, useContext, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  IconMenu2,
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
import { useWidgetVisibility } from "./WidgetVisibilityContext";

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
  return <SidebarContext.Provider value={{ open, setOpen }}>{children}</SidebarContext.Provider>;
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
  onSymbolSelect,
}: {
  onShowCalendar: () => void;
  onSymbolSelect?: (symbol: string) => void;
}) => {
  const { open, setOpen } = useSidebar();
  const navigate = useNavigate();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedMarket) {
      const eventSource = new EventSource(
        `http://localhost:5000/api/symbols/stream?category=${selectedMarket}`
      );
      eventSource.onmessage = (event) => {
        const newSymbols = JSON.parse(event.data);
        setSymbols((prevSymbols) => [...prevSymbols, ...newSymbols]);
      };
      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();
      };
      return () => {
        eventSource.close();
      };
    }
  }, [selectedMarket]);

  const handleHover = useCallback((category: string) => {
    setSelectedMarket(category);
    setSymbols([]);
    setLoading(true);
    fetch(`http://localhost:5000/api/symbols?category=${category}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch symbols");
        return response.json();
      })
      .then((data) => {
        console.log("📦 Fetched symbols:", data.symbols);
        setSymbols(data.symbols || []);
      })
      .catch((error) => {
        console.error("❌ Error fetching symbols:", error);
        setError("Failed to fetch symbols. Please try again.");
        setSymbols([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filteredSymbols = symbols.filter(
    (symbol) =>
      symbol.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      symbol.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-gray-900 dark:bg-gray-800 shadow-lg z-50 hidden md:flex flex-col"
      variants={sidebarVariants}
      initial="collapsed"
      animate={open ? "expanded" : "collapsed"}
      onMouseEnter={() => !selectedMarket && setOpen(true)}
      onMouseLeave={() => !selectedMarket && setOpen(false)}
      style={{ overflow: "hidden" }}
    >
      <div className="flex flex-col h-full">
        <SidebarContent onShowCalendar={onShowCalendar} setSelectedMarket={setSelectedMarket} onHover={handleHover} />
        <SidebarWidgetControls />
      </div>

      <AnimatePresence>
        {selectedMarket && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-[64px] left-[280px] h-[calc(100vh-64px)] bg-gray-900 dark:bg-gray-800 shadow-lg z-50 w-[600px]"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4 text-white">
                <h2 className="text-lg font-bold">{selectedMarket.toUpperCase()}</h2>
                <IconX className="cursor-pointer" onClick={() => setSelectedMarket(null)} />
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <IconSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              {loading ? (
                <div className="text-center text-white">Loading...</div>
              ) : error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : (
                <div ref={tableContainerRef} className="overflow-y-auto h-[calc(100vh-150px)] custom-scrollbar">
                  <table className="w-full text-white">
                    <thead>
                      <tr className="bg-gray-700">
                        <th className="px-4 py-2 text-left font-medium">Symbol</th>
                        <th className="px-4 py-2 text-left font-medium">Description</th>
                        <th className="px-4 py-2 text-left font-medium">Exchange</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSymbols.map((symbol) => (
                        <tr
                          key={`${symbol.symbol}-${symbol.exchange}`}
                          className="hover:bg-gray-700 transition-all duration-150 cursor-pointer"
                          onClick={() => {
                            navigate(`/dashboard/${selectedMarket}/${symbol.symbol}`);
                            setSelectedMarket(null);
                            setOpen(false);
                          }}
                        >
                          <td className="px-4 py-2 font-normal">{symbol.symbol}</td>
                          <td className="px-4 py-2 font-normal">{symbol.description}</td>
                          <td className="px-4 py-2 font-normal">{symbol.exchange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SidebarWidgetControls: React.FC = () => {
  const { widgetVisibility, setWidgetVisibility } = useWidgetVisibility();
  const location = useLocation();
  const pathParts = location.pathname.split("/");
  const activeCategory = pathParts[2] || "stocks";

  const widgetToggleMapping: Record<string, { id: string; name: string }[]> = {
    stocks: [
      { id: "symbol-info", name: "Symbol Info" },
      { id: "advanced-chart", name: "Advanced Chart" },
      { id: "company-profile", name: "Company Profile" },
      { id: "fundamental-data", name: "Fundamental Data" },
      { id: "technical-analysis", name: "Technical Analysis" },
      { id: "top-stories", name: "Top Stories" },
    ],
    crypto: [
      { id: "symbol-info", name: "Symbol Info" },
      { id: "advanced-chart", name: "Advanced Chart" },
      { id: "company-profile", name: "Company Profile" },
      { id: "technical-analysis", name: "Technical Analysis" },
      { id: "top-stories", name: "Top Stories" },
      { id: "crypto-coins-heatmap", name: "Coins Heatmap" },
      { id: "cryptocurrency-market", name: "Crypto Market" },
    ],
    forex: [
      { id: "symbol-info", name: "Symbol Info" },
      { id: "advanced-chart", name: "Advanced Chart" },
      { id: "company-profile", name: "Company Profile" },
      { id: "technical-analysis", name: "Technical Analysis" },
      { id: "top-stories", name: "Top Stories" },
      { id: "economic-calendar", name: "Economic Calendar" },
      { id: "forex-cross-rates", name: "Forex Cross Rates" },
    ],
  };

  const controls = widgetToggleMapping[activeCategory] || [];
  return (
    <div className="mt-auto p-3 border-t border-gray-700">
      <h3 className="text-sm font-semibold text-white mb-2">Widget Controls</h3>
      <div className="flex flex-col gap-1">
        {controls.map((ctrl) => (
          <button
            key={ctrl.id}
            onClick={() =>
              setWidgetVisibility((prev: Record<string, boolean>) => ({
                ...prev,
                [ctrl.id]: !prev[ctrl.id],
              }))
            }
            className={`px-2 py-1 rounded text-xs ${
              widgetVisibility[ctrl.id] ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-800"
            }`}
          >
            {ctrl.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileSidebar = ({ onShowCalendar }: { onShowCalendar: () => void }) => {
  const { open, setOpen } = useSidebar();
  return (
    <div className="md:hidden">
      <div className="h-10 px-4 py-4 flex items-center justify-between bg-gray-900 dark:bg-gray-800 fixed top-0 left-0 w-full z-50 shadow-lg">
        <IconMenu2 className="text-white cursor-pointer" onClick={() => setOpen(!open)} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed h-full w-full inset-0 bg-gray-900 dark:bg-gray-800 p-4 z-50 flex flex-col overflow-y-auto">
            <SidebarContent onShowCalendar={onShowCalendar} onLinkClick={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarContent = ({
  onShowCalendar,
  onLinkClick,
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
    { label: "Forex", icon: <IconGraphFilled />, onClick: () => setSelectedMarket?.("forex"), onMouseEnter: () => onHover?.("forex") },
    { label: "Crypto", icon: <IconCurrencyBitcoin />, onClick: () => setSelectedMarket?.("crypto"), onMouseEnter: () => onHover?.("crypto") },
    { label: "Actions", icon: <IconActivity />, onClick: () => setSelectedMarket?.("stocks"), onMouseEnter: () => onHover?.("stocks") },
    { label: "Commodities", icon: <IconComponents /> },
    { label: "Bonds", icon: <IconDeviceHeartMonitorFilled />, onClick: () => setSelectedMarket?.("bonds"), onMouseEnter: () => onHover?.("bonds") },
    { label: "Calendar", icon: <IconCalendar />, onClick: () => navigate("/calendar") },
    { label: "News", icon: <IconNews />, onClick: () => navigate("/news") },
    { label: "Settings", icon: <IconSettings />, onClick: () => navigate("/settings") },
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

export default Sidebar;
