// src/layouts/DashboardLayout.tsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../pages/dashboard/components/Sidebar";

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Remove auth token
    navigate("/login"); // Redirect to login page
  };

  // Dummy handler for onShowCalendar
  const handleShowCalendar = () => {
    // You can implement calendar logic here; for now, we'll just navigate to a calendar route
    navigate("/calendar");
  };

  return (
    <div>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-[64px] bg-gray-800 text-white z-50 flex items-center px-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <span className="text-2xl font-bold">IZYS</span>
          <button onClick={handleLogout} className="ml-auto text-sm bg-red-500 px-4 py-2 rounded">
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar + Main Content */}
      <div className="flex pt-[64px]">
        <Sidebar onShowCalendar={handleShowCalendar} />
        <main className="flex-grow p-4 ml-[70px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
