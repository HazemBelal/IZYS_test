// src/layouts/AuthLayout.tsx
import React from "react";
import { Outlet } from "react-router-dom";

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {/* Only the login page (or other auth pages) will be rendered here */}
      <Outlet />
    </div>
  );
};

export default AuthLayout;
