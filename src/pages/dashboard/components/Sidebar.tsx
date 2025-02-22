import React, { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconMenu2,
  IconSearch,
  IconGraphFilled,
  IconCurrencyBitcoin,
  IconActivity,
  IconComponents,
  IconDeviceHeartMonitorFilled,
  IconLetterESmall,
  IconHeartPlus,
  IconNews,
  IconCalendar,
  IconSettings,
  IconX,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import TickerWidget from "./TickerWidget";
import BondsWidgetComponent from "./BondsWidget"; // Rename import to avoid conflicts
import NewsWidget from "./NewsWidget";
import ForexWidget from "./ForexWidget";
import CryptoWidget from "./CryptoWidget";
import TradingViewWidget from "./TradingViewWidget";
import MarketDataWidget from "./MarketDataWidget";
import TradingViewCalendarWidget from "./TradingViewCalendarWidget";
import { useNavigate } from 'react-router-dom';


// Interface for the links
interface LinkItem {
  label: string;
  key: string; // Unique key for each panel
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

// Props for Sidebar including onShowCalendar
interface SidebarProps {
  onShowCalendar: () => void;  // The function to show the calendar
}

// Context to manage sidebar state
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activePanel: string | null;
  setActivePanel: React.Dispatch<React.SetStateAction<string | null>>;
  showNewsPanel: boolean;
  setShowNewsPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar provider to manage open/close state
const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showNewsPanel, setShowNewsPanel] = useState(false); // Make sure this exists!

  return (
    <SidebarContext.Provider value={{ open, setOpen, activePanel, setActivePanel, showNewsPanel, setShowNewsPanel }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Sidebar component with props for onShowCalendar
export const Sidebar = () => {
  const navigate = useNavigate(); // ✅ Import useNavigate

  // ✅ Redirects to Forex Factory calendar page
  const onShowCalendar = () => {
    navigate("/calendar"); // ✅ Ensures navigation to the correct path
  };

  return (
    <SidebarProvider>
      <DesktopSidebar onShowCalendar={onShowCalendar} />
      <MobileSidebar onShowCalendar={onShowCalendar} />
      <AnimatePresence>
        <ExtendedPanels />
      </AnimatePresence>
    </SidebarProvider>
  );
};

// Animation settings for sidebar toggle
const sidebarVariants = {
  expanded: {
    width: '250px',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
  collapsed: {
    width: '70px',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

// Desktop Sidebar component
const DesktopSidebar = ({ onShowCalendar }: SidebarProps) => {
  const { open, setOpen, activePanel } = useSidebar();

  return (
    <motion.div
      className="fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-800 shadow-lg z-50"
      variants={sidebarVariants}
      initial="collapsed"
      animate={open || activePanel ? 'expanded' : 'collapsed'} // Keep open when a panel is active
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !activePanel && setOpen(false)} // Collapse only if no panel is open
      style={{ overflow: 'hidden' }}
    >
      <div className="flex flex-col h-full p-4">
        <SidebarContent onShowCalendar={onShowCalendar} />
      </div>
    </motion.div>
  );
};

// Mobile Sidebar component
const MobileSidebar = ({ onShowCalendar }: SidebarProps) => {
  const { open, setOpen } = useSidebar();

  return (
    <div className="md:hidden">
      <div className="h-10 px-4 py-4 flex items-center justify-between bg-gray-100 dark:bg-gray-800 fixed top-0 left-0 w-full z-50 shadow-lg">
        <IconMenu2
          className="text-gray-800 dark:text-gray-200 cursor-pointer"
          onClick={() => setOpen(!open)}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed h-full w-full inset-0 bg-gray-100 dark:bg-gray-800 p-4 z-50 flex flex-col overflow-y-auto"
          >
            <div className="flex flex-col h-full mt-10">
              <SidebarContent onShowCalendar={onShowCalendar} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarContent = ({ onShowCalendar }: SidebarProps) => {
  const { open, setActivePanel, setShowNewsPanel, activePanel } = useSidebar();
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);
  const navigate = useNavigate(); // ✅ Define navigate inside SidebarContent

  const handlePanelClick = (panelKey: string) => {
    if (panelKey === 'news' || panelKey === 'calendar') {
      setActivePanel(null);
      setShowNewsPanel(false);
    } else {
      setActivePanel(panelKey);
      setShowNewsPanel(true);
    }

    if (panelKey === 'calendar') {
      setShowCalendarOptions(!showCalendarOptions); // Toggle calendar options
    }
  };

  const handleCalendarOptionClick = (option: 'forexFactory' | 'tradingView') => {
    setShowCalendarOptions(false); // ✅ Close dropdown
  
    if (option === 'forexFactory') {
      console.log("Redirecting to /calendar"); // ✅ Debugging step
      setActivePanel(null); // ✅ Close the panel
      setShowNewsPanel(false); // ✅ Hide News Panel if open
      navigate("/calendar"); // ✅ Navigates to /calendar
    } else if (option === 'tradingView') {
      setActivePanel('tradingViewCalendar'); // ✅ Opens TradingView Calendar inside the panel
    }
  };
  

  const sidebarLinks: LinkItem[] = [
    { label: 'Forex', key: 'forex', icon: <IconGraphFilled className="text-white text-lg" /> },
    { label: 'Crypto', key: 'crypto', icon: <IconCurrencyBitcoin className="text-white text-lg" /> },
    { label: 'Actions', key: 'actions', icon: <IconActivity className="text-white text-lg" /> },
    { label: 'Commodities', key: 'commodities', icon: <IconComponents className="text-white text-lg" /> },
    { label: 'Bonds', key: 'bonds', icon: <IconDeviceHeartMonitorFilled className="text-white text-lg" /> },
    { label: 'ETF', key: 'etf', icon: <IconLetterESmall className="text-white text-2xl" /> },
    { label: 'Favorites', key: 'favorites', icon: <IconHeartPlus className="text-white text-lg" />, href: '/favorites' },
    { label: 'Calendrier Économique', key: 'calendar', icon: <IconCalendar className="text-white text-lg" />, onClick: () => handlePanelClick('calendar') },
    { label: 'News', key: 'news', icon: <IconNews className="text-white text-lg" />, href: '/news' },
  ];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-4">
        {/* Search bar */}
        <div className="flex items-center justify-center px-2 py-4">
          {open ? (
            <motion.input
              type="text"
              placeholder="Search..."
              className="w-full px-2 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <IconSearch className="text-gray-700 dark:text-gray-200 text-xl cursor-pointer" />
          )}
        </div>

        {/* Sidebar Links with handlePanelClick */}
        {sidebarLinks.map((link) => (
          <div key={link.key}>
            <SidebarLink
              link={link}
              onClick={() => handlePanelClick(link.key)}
            />
            {/* Calendar Submenu */}
            {link.key === 'calendar' && showCalendarOptions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-8 space-y-2"
            >
              {/* ✅ Redirects to the Forex Factory Calendar */}
              <div
                className="flex items-center gap-2 py-2 px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => handleCalendarOptionClick('forexFactory')}
              >
                <span className="text-sm font-medium">Forex Factory</span>
              </div>

              {/* ✅ Opens TradingView Widget in Dashboard */}
              <div
                className="flex items-center gap-2 py-2 px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                onClick={() => handleCalendarOptionClick('tradingView')}
              >
                <span className="text-sm font-medium">TradingView</span>
              </div>
            </motion.div>
          )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-300 dark:border-gray-700 my-4" />
      {/* Bottom Links */}
      <div className="space-y-4">
        <SidebarLink
          link={{ label: 'Settings', key: 'settings', icon: <IconSettings className="text-white text-lg" />, href: '/settings' }}
          onClick={() => setActivePanel('settings')}
        />
      </div>
    </div>
  );
};


// SidebarLink component with hover effects
const SidebarLink = ({ link, onClick }: { link: LinkItem; onClick: () => void }) => {
  const { open } = useSidebar();

  return (
    <Link
      to={link.href || '#'}
      onClick={(e) => {
        if (link.onClick) link.onClick(); // Handle onClick for calendar
        if (!link.href) {
          e.preventDefault(); // Prevent default navigation if no href
        }
        onClick(); // Always call the onClick handler
      }}
      className="flex items-center gap-2 py-2 px-3 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
    >
      {link.icon}
      {open && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-sm font-medium"
        >
          {link.label}
        </motion.span>
      )}
    </Link>
  );
};

// Extended Panels (For Forex, Crypto, Bonds, etc.)
const ExtendedPanels = () => {
  const { activePanel, setActivePanel, showNewsPanel, setShowNewsPanel } = useSidebar();

  const panelTitles: { [key: string]: string } = {
    forex: "Forex Market",
    crypto: "Crypto Market",
    actions: "Stock Market",
    commodities: "Commodities Market",
    bonds: "Bonds Market",
    etf: "ETF Market",
    tradingViewCalendar: "TradingView Calendar",
  };

  return (
    <AnimatePresence>
      {activePanel && (
        <div className="flex fixed top-[40px] left-[250px] h-[95vh] w-[calc(100%-250px)] bg-gray-100 dark:bg-gray-800 shadow-lg z-50 p-4 overflow-y-auto"> {/* Enable scrolling for the entire panel */}
          {/* Left Panel: Market Overview & Calendar */}
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-[70%] flex flex-col pr-4"
          >
            {/* TradingView Calendar Panel */}
            {activePanel === "tradingViewCalendar" ? (
            <div
              className="bg-white dark:bg-gray-800 p-4 shadow-md rounded-lg"
              style={{ width: '100%', height: '100%' }} // Ensure the parent container takes full space
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                {panelTitles[activePanel]}
              </h2>
              <div style={{ height: 'calc(100% - 40px)' }}> {/* Adjust height to account for the title */}
                <TradingViewCalendarWidget />
                </div>
              </div>
            ) : (
              <>
                {/* Market Overview Panel */}
                <div className="bg-white dark:bg-gray-800 p-4 shadow-md rounded-lg">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    {panelTitles[activePanel]}
                  </h2>
                  {activePanel === "forex" && <ForexWidget />}
                  {activePanel === "crypto" && <CryptoWidget />}
                  {activePanel === "bonds" && <BondsWidgetComponent />}
                  {activePanel === "etf" && <TradingViewWidget />}
                </div>

                {/* Market Data Panel (Hidden for ETFs) */}
                {activePanel !== "etf" && (
                  <div className="bg-white dark:bg-gray-800 p-4 shadow-md rounded-lg mt-4">
                    {activePanel === "forex" && <MarketDataWidget type="forex" />}
                    {activePanel === "crypto" && <MarketDataWidget type="crypto" />}
                    {activePanel === "bonds" && <MarketDataWidget type="bonds" />}
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Ticker Widget: Fixed at the Bottom */}
          <div className="fixed bottom-0 left-[250px] w-[calc(100%-250px)] bg-gray-800 dark:bg-gray-900 shadow-lg z-50 p-4">
            <TickerWidget />
          </div>

          {/* Right Panel: Latest News */}
          {showNewsPanel && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-[40px] right-[0px] h-[calc(95vh-40px)] w-[28%] bg-gray-100 dark:bg-gray-800 shadow-lg p-4 flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Latest News</h2>
                <IconX
                  className="text-white cursor-pointer"
                  onClick={() => {
                    setShowNewsPanel(false);
                    setActivePanel(null);
                  }}
                />
              </div>
              <div className="flex-grow overflow-hidden">
                <NewsWidget />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};




export default Sidebar;