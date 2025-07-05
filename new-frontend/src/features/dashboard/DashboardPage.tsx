//new-frontend\src\features\dashboard\DashboardPage.tsx
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import WidgetGallery from './WidgetGallery';
import DashboardGrid from './DashboardGrid';
import { useDashboard } from '../../context/DashboardContext';

const DashboardPage: React.FC = () => {
  const { widgets, clearAllWidgets } = useDashboard();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    await clearAllWidgets();
    setClearing(false);
  };

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      position: 'relative',
      bgcolor: '#f7f9fb'
    }}>
      {/* Floating Action Button for adding widgets */}
      <Fab
        color="primary"
        aria-label="add widget"
        onClick={() => setGalleryOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Clear All Button - only show when there are widgets */}
      {widgets.length > 0 && (
        <Button
          variant="outlined"
          color="error"
          onClick={handleClearAll}
          disabled={clearing}
          sx={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          {clearing ? 'Clearing...' : 'Clear All'}
        </Button>
      )}

      {/* Empty State */}
      {widgets.length === 0 ? (
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            textAlign: 'center',
            px: 3
          }}
        >
          <Typography variant="h4" color="text.secondary" gutterBottom>
            Your dashboard is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
            Start building your personalized dashboard by adding widgets for the markets you want to track.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => setGalleryOpen(true)}
            startIcon={<AddIcon />}
          >
            Add Your First Widget
          </Button>
        </Box>
      ) : (
        <DashboardGrid />
      )}

      <WidgetGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </Box>
  );
};

export default DashboardPage; 