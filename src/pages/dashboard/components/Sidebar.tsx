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
  IconX, // Close button
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Interface for Sidebar Links
interface LinkItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

// Sidebar Props
interface SidebarProps {
  onShowCalendar: () => void;
}

// Sidebar Context
interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showBondsPanel: boolean;
  setShowBondsPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Sidebar Provider
export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [showBondsPanel, setShowBondsPanel] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen, showBondsPanel, setShowBondsPanel }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Sidebar Component
export const Sidebar = ({ onShowCalendar }: SidebarProps) => {
  return (
    <SidebarProvider>
      <DesktopSidebar onShowCalendar={onShowCalendar} />
      <MobileSidebar onShowCalendar={onShowCalendar} />
      <AnimatePresence>
        <BondsPanel />
      </AnimatePresence>
    </SidebarProvider>
  );
};

// Sidebar animation settings
const sidebarVariants = {
  expanded: { width: '250px', transition: { type: 'spring', stiffness: 100, damping: 20 } },
  collapsed: { width: '70px', transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

// Desktop Sidebar Component
const DesktopSidebar = ({ onShowCalendar }: SidebarProps) => {
  const { open, setOpen, showBondsPanel } = useSidebar();

  return (
    <motion.div
      className="fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-800 shadow-lg z-50"
      variants={sidebarVariants}
      initial="collapsed"
      animate={open || showBondsPanel ? 'expanded' : 'collapsed'} // Keep open when Bonds is active
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => !showBondsPanel && setOpen(false)} // Collapse only if Bonds is NOT open
      style={{ overflow: 'hidden' }}
    >
      <div className="flex flex-col h-full">
        <SidebarContent onShowCalendar={onShowCalendar} />
      </div>
    </motion.div>
  );
};

// Mobile Sidebar Component
const MobileSidebar = ({ onShowCalendar }: SidebarProps) => {
  const { open, setOpen } = useSidebar();

  return (
    <div className="md:hidden">
      <div className="h-10 px-4 py-4 flex items-center justify-between bg-gray-100 dark:bg-gray-800 fixed top-0 left-0 w-full z-50 shadow-lg">
        <IconMenu2 className="text-gray-800 dark:text-gray-200 cursor-pointer" onClick={() => setOpen(!open)} />
      </div>
    </div>
  );
};

// Sidebar Content
const SidebarContent = ({ onShowCalendar }: SidebarProps) => {
  const { open, setShowBondsPanel } = useSidebar();

  const sidebarLinks: LinkItem[] = [
    { label: 'Forex', href: '/forex', icon: <IconGraphFilled className="text-white text-lg" /> },
    { label: 'Crypto', href: '/crypto', icon: <IconCurrencyBitcoin className="text-white text-lg" /> },
    { label: 'Actions', href: '/actions', icon: <IconActivity className="text-white text-lg" /> },
    { label: 'Commodities', href: '/commodities', icon: <IconComponents className="text-white text-lg" /> },
    { label: 'Bonds', icon: <IconDeviceHeartMonitorFilled className="text-white text-lg" />, onClick: () => setShowBondsPanel(true) },
    { label: 'ETF', href: '/etf', icon: <IconLetterESmall className="text-white text-2xl" /> },
    { label: 'Favorites', href: '/favorites', icon: <IconHeartPlus className="text-white text-lg" /> },
    { label: 'Calendrier Économique', href: '/calendar', icon: <IconCalendar className="text-white text-lg" />, onClick: onShowCalendar },
    { label: 'News', href: '/news', icon: <IconNews className="text-white text-lg" /> },
  ];

  return (
    <div className="flex flex-col h-full justify-between px-2 space-y-2"> {/* Adjusted Spacing */}
      {sidebarLinks.map((link) => (
        <SidebarLink key={link.label} link={link} />
      ))}
    </div>
  );
};

// Bonds Panel (Extends from Sidebar)
const BondsPanel = () => {
  const { showBondsPanel, setShowBondsPanel, setOpen } = useSidebar();

  return (
    <AnimatePresence>
      {showBondsPanel && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed top-[64px] left-[250px] h-full w-[50%] bg-gray-100 dark:bg-gray-800 shadow-lg z-50 p-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Bonds Market</h2>
            <IconX
              className="text-white cursor-pointer"
              onClick={() => {
                setShowBondsPanel(false);
                setOpen(false); // Close sidebar when Bonds panel is closed
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// SidebarLink Component
const SidebarLink = ({ link }: { link: LinkItem }) => {
  const { open } = useSidebar();

  return (
    <Link
      to={link.href || '#'}
      onClick={link.onClick}
      className="flex items-center gap-2 py-3 px-3 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-150"
    >
      {link.icon}
      {open && <span className="text-sm font-medium">{link.label}</span>}
    </Link>
  );
};

export default Sidebar;
