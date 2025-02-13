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
  IconSettings, // Import settings icon
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

// Interface for the links
interface LinkItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
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
export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Main Sidebar component with props for onShowCalendar
export const Sidebar = ({ onShowCalendar }: SidebarProps) => {
  return (
    <SidebarProvider>
      <DesktopSidebar onShowCalendar={onShowCalendar} />
      <MobileSidebar onShowCalendar={onShowCalendar} />
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
  const { open, setOpen } = useSidebar();

  return (
    <motion.div
      className="fixed top-[64px] left-0 h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-800 shadow-lg z-50"
      variants={sidebarVariants}
      initial="collapsed"
      animate={open ? 'expanded' : 'collapsed'}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ overflow: 'hidden' }}
    >
      <div className="flex flex-col h-full">
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

// SidebarContent with buttons and search bar
const SidebarContent = ({ onShowCalendar }: SidebarProps) => {
  const { open } = useSidebar();

  const sidebarLinks: LinkItem[] = [
    { label: 'Forex', href: '/forex', icon: <IconGraphFilled className="text-white text-lg" /> },
    { label: 'Crypto', href: '/crypto', icon: <IconCurrencyBitcoin className="text-white text-lg" /> },
    { label: 'Actions', href: '/actions', icon: <IconActivity className="text-white text-lg" /> },
    { label: 'Commodities', href: '/commodities', icon: <IconComponents className="text-white text-lg" /> },
    { label: 'Bonds', href: '/bonds', icon: <IconDeviceHeartMonitorFilled className="text-white text-lg" /> },
    { label: 'ETF', href: '/etf', icon: <IconLetterESmall className="text-white text-2xl" /> },
    { label: 'Favorites', href: '/favorites', icon: <IconHeartPlus className="text-white text-lg" /> },
    { label: 'Calendrier Économique', href: '/calendar', icon: <IconCalendar className="text-white text-lg" />, onClick: onShowCalendar }, // Calendar
    { label: 'News', href: '/news', icon: <IconNews className="text-white text-lg" /> },  // News page link
];


  return (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-2"> {/* Reduced space between buttons */}
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

        {/* Sidebar Links */}
        {sidebarLinks.map((link) => (
          <SidebarLink key={link.label} link={link} />
        ))}
      </div>

      <div className="border-t border-gray-300 dark:border-gray-700 my-4" />
      {/* Bottom Links */}
      <div className="space-y-2"> {/* Reduced space between bottom links */}
        <SidebarLink
          link={{ label: 'News', href: '/news', icon: <IconNews className="text-white text-lg" /> }} 
        />
        <SidebarLink
          link={{ label: 'Settings', href: '/settings', icon: <IconSettings className="text-white text-lg" /> }} 
        />
      </div>
    </div>
  );
};

// SidebarLink component with hover effects
const SidebarLink = ({ link }: { link: LinkItem }) => {
  const { open } = useSidebar();

  return (
    <Link
      to={link.href || '#'}
      onClick={link.onClick}  // Add the onClick event to handle showing the calendar
      className="flex items-center gap-2 py-2 pl-3 pr-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all duration-150"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}  // Subtle hover effect on icons
        transition={{ type: 'spring', stiffness: 300 }}
        className="flex-shrink-0"
      >
        {link.icon}
      </motion.div>
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

export default Sidebar;
