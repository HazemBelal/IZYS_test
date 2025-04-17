// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./Login";
import Calendar from "./pages/dashboard/components/CalendarEconomic";
import News from "./pages/dashboard/components/News";
import BondsWidget from "./pages/dashboard/components/BondsWidget";
import DashboardWidget from "./pages/dashboard/components/DashboardWidget";
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

            {/* Settings Route now has a child */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  {/* Replace this with your actual Settings component */}
                  <div className="p-4 text-white">
                    <h1 className="text-2xl">Settings</h1>
                    <p>Settings page coming soon.</p>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Backward‐compatible symbol route */}
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
