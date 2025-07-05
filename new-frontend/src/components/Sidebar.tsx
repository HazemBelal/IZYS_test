import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon color="primary" /> },
  { label: 'News', path: '/news', icon: <NewspaperIcon color="primary" /> },
  { label: 'Calendar', path: '/calendar', icon: <CalendarMonthIcon color="primary" /> },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          background: '#fff',
          borderRight: '1px solid #E5EAF2',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* IZYS Branding */}
      <Box sx={{ 
        pt: 3,
        pb: 2,
        px: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        borderBottom: '1px solid #E5EAF2',
        mb: 1
      }}>
        <Box sx={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: theme.palette.primary.main,
          boxShadow: `0 0 16px ${theme.palette.primary.main}33`,
        }} />
        <Typography 
          variant="h3"
          sx={{ 
            fontWeight: 900,
            fontSize: '2.1rem',
            color: theme.palette.primary.main,
            letterSpacing: '0.12em',
            fontFamily: 'Inter, Roboto, sans-serif',
            textShadow: `0 2px 8px ${theme.palette.primary.main}22`,
            lineHeight: 1.1
          }}
        >
          IZYS
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  borderRadius: 2,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(61, 240, 126, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(61, 240, 126, 0.15)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Info and Logout */}
      <Box sx={{ p: 2, borderTop: '1px solid #E5EAF2' }}>
        {user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Signed in as
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {user.userLogin}
            </Typography>
          </Box>
        )}
        
        <ListItemButton
          onClick={logout}
          sx={{
            color: 'error.main',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 92, 92, 0.1)',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 