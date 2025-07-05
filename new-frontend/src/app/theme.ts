import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#5048E5',
      contrastText: '#fff',
    },
    secondary: {
      main: '#10B981',
      contrastText: '#fff',
    },
    background: {
      default: '#F4F6F8',
      paper: '#fff',
    },
    text: {
      primary: '#121828',
      secondary: '#65748B',
    },
    success: {
      main: '#3DF07E',
    },
    error: {
      main: '#FF5C5C',
    },
    warning: {
      main: '#FF8C43',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default theme; 