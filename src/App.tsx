// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./Login";
import Calendar from "./pages/dashboard/components/CalendarEconomic";
import News from "./pages/dashboard/components/News";
import BondsWidget from "./pages/dashboard/components/BondsWidget";
import DashboardWidget from "./pages/dashboard/components/DashboardWidget";
import Settings from "./pages/dashboard/components/Settings";
import { WidgetVisibilityProvider } from "./pages/dashboard/components/WidgetVisibilityContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <WidgetVisibilityProvider>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route
            path="/login"
            element={<Login />}
          />
          {/* If user goes to root and is not authenticated, send to login */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Route>

        {/* Main App Routes */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardWidget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <News />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bonds"
            element={
              <ProtectedRoute>
                <BondsWidget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:category/:symbol"
            element={
              <ProtectedRoute>
                <DashboardWidget />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:symbol"
            element={
              <ProtectedRoute>
                <DashboardWidget />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </WidgetVisibilityProvider>
  );
};

export default App;
