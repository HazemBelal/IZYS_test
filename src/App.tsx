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
import { DashboardWidgetsProvider } from "./context/DashboardWidgetsContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <DashboardWidgetsProvider>
      <WidgetVisibilityProvider>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
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
            {/* Keep these routes for backward compatibility if needed, but they won't be primary */}
            <Route
              path="/dashboard/:category/:symbol"
              element={
                <ProtectedRoute>
                  <DashboardWidget />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </WidgetVisibilityProvider>
    </DashboardWidgetsProvider>
  );
};

export default App;