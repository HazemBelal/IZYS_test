import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar'; // Ensure correct import path
import { IconMenu2 } from '@tabler/icons-react';
import logo from '@/assets/logo-site.png'; // Adjust the path according to your structure
import Calendar from '@/pages/dashboard/components/CalendarEconomic'; // Import the Calendar component

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar open state

  return (
    <div className="flex flex-col h-screen">
      {/* Top Menu Bar */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center shadow-md fixed top-0 left-0 right-0 z-50 h-[64px]">
        {/* Left Section: Logo and Mobile Menu Button */}
        <div className="flex items-center">
          <button
            className="text-white text-xl md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)} // Toggle sidebar on mobile
          >
            <IconMenu2 />
          </button>
          <div className="relative flex items-center ml-4">
            <img
              src={logo}
              alt="Logo"
              className="h-12 mr-3" // Adjust size as needed
            />
            <span className="text-2xl font-bold">IZYS</span>
          </div>
        </div>

        {/* Right Section: Links */}
        <div className="space-x-4">
          <span>Portfolio</span>
          <span>Educational Content</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-[64px]"> {/* Padding to account for the top menu */}
        {/* Sidebar (Shifted down by 64px to align under the top menu) */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main content */}
        <div className="flex-1 p-4">
          <main>
            <h1 className="text-2xl font-bold mb-4"></h1>
            <Calendar /> {/* Calendar component */}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
