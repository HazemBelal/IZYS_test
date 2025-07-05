import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardPage from '../features/dashboard/DashboardPage';
import NewsTab from '../features/news/NewsTab';
import CalendarTab from '../features/calendar/CalendarTab';
import LoginPage from '../features/auth/LoginPage';
import { DashboardProvider } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAuthPage = location.pathname === '/login';

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated && !isAuthPage) {
    return <Navigate to="/login" replace />;
  }

  // If on login page and authenticated, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show login page if not authenticated
  if (isAuthPage) {
    return <LoginPage />;
  }

  // Show main app layout for authenticated users
  return (
    <DashboardProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Toolbar>
              <Typography variant="h6" color="primary" fontWeight={700} sx={{ flexGrow: 1 }}>
                Trading Dashboard
              </Typography>
            </Toolbar>
          </AppBar>
          <Box sx={{ flex: 1, p: 3 }}>
            <Routes>
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/news" element={
                <ProtectedRoute>
                  <NewsTab />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <CalendarTab />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </DashboardProvider>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App; 