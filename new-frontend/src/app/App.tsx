import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Sidebar from '../components/Sidebar';
import DashboardPage from '../features/dashboard/DashboardPage';
import NewsTab from '../features/news/NewsTab';
import CalendarTab from '../features/calendar/CalendarTab';
import LoginPage from '../features/auth/LoginPage';
import { DashboardProvider } from '../context/DashboardContext';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login';

  if (isAuthPage) {
    return <LoginPage />;
  }

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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/news" element={<NewsTab />} />
              <Route path="/calendar" element={<CalendarTab />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      </Box>
    </DashboardProvider>
  );
};

export default App; 