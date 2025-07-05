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
});

export default theme; 