import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { IconMenu2 } from '@tabler/icons-react';
import logo from '@/assets/logo-site.png';
import Calendar from '@/pages/dashboard/components/CalendarEconomic';
import TradingViewWidgets from './components/TradingViewWidgets';

const Dashboard = () => {
  // For testing, use a constant static symbol.
  const staticSymbol = "NASDAQ:NVDA";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // You can still handle symbol selection if needed
  const handleSymbolSelect = (symbol: string) => {
    // For testing, override the symbol with the static one
    setSidebarOpen(false);
    // Optionally log the clicked symbol and force a static symbol.
    console.log("Symbol clicked:", symbol, "Using static:", staticSymbol);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50 h-[64px]">
        <div className="flex items-center">
          <button className="text-white text-xl md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <IconMenu2 />
          </button>
          <div className="relative flex items-center ml-4">
            <img src={logo} alt="Logo" className="h-12 mr-3" />
            <span className="text-2xl font-bold">IZYS</span>
          </div>
        </div>
        <div className="space-x-4">
          <span>Portfolio</span>
          <span>Educational Content</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-[64px]">
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onShowCalendar={() => {}}
          onSymbolSelect={handleSymbolSelect}
        />
        <div className="flex-1 p-4">
          <main>
            <TradingViewWidgets symbol={staticSymbol} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
