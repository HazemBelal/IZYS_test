//new-frontend\src\features\dashboard\DashboardGrid.tsx
import React, { useCallback } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useDashboard } from '../../context/DashboardContext';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { TradingViewWidget } from '../../components/TradingViewWidget';
import './DashboardGrid.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardGrid: React.FC = () => {
  const { widgets, layout, updateLayout, removeWidget } = useDashboard();

  const handleLayoutChange = useCallback(async (currentLayout: any, allLayouts: any) => {
    await updateLayout(currentLayout);
  }, [updateLayout]);

  const handleRemoveWidget = useCallback(async (id: string | number) => {
    try {
      await removeWidget(id);
    } catch (error) {
      console.error('Error removing widget:', error);
      // You could add a toast notification here
    }
  }, [removeWidget]);

  // Convert widgets to grid layout format
  const gridLayout = layout.map(item => ({
    ...item,
    minW: 2,
    minH: 2,
    maxW: 12,
    maxH: 12,
  }));

  // Calculate dynamic height based on widget positions
  const maxY = layout.length > 0 ? Math.max(...layout.map(item => item.y + item.h)) : 0;
  const dynamicHeight = Math.max(100, (maxY + 2) * 60 + 32); // 60px per row + padding

  return (
    <Box sx={{ 
      width: '100vw', 
      height: '100vh', 
      bgcolor: '#f7f9fb',
      overflow: 'auto'
    }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: gridLayout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        isDraggable={true}
        isResizable={true}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[16, 16]}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        autoSize={true}
        style={{ minHeight: `${dynamicHeight}px` }}
      >
        {widgets.map(widget => (
          <Box
            key={widget.id}
            sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'white',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Widget Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                px: 2,
                py: 1,
                bgcolor: 'grey.50',
                borderBottom: '1px solid',
                borderColor: 'grey.200',
                cursor: 'move'
              }}
            >
              <Typography variant="body2" fontWeight="medium" noWrap>
                {widget.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleRemoveWidget(widget.id)}
                sx={{ 
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {/* Widget Content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
              }}
            >
              {widget.scriptSrc || widget.script_src ? (
                <TradingViewWidget 
                  id={widget.id} 
                  scriptSrc={widget.scriptSrc ?? widget.script_src!}
                  config={widget.config} 
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.secondary'
                }}>
                  <Typography variant="body2">No script source available</Typography>
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default DashboardGrid; 