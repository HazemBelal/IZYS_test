import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as widgetsApi from '../api/widgets';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string | number;
  symbol: string;
  category: string;
  widgetType?: string;
  widget_type?: string;
  name: string;
  position: WidgetPosition;
  config: Record<string, any>;
  scriptSrc?: string;
  script_src?: string;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  [key: string]: any;
}

interface DashboardContextType {
  widgets: DashboardWidget[];
  layout: GridLayoutItem[];
  addWidget: (widget: any) => Promise<void>;
  removeWidget: (id: string | number) => Promise<void>;
  updateLayout: (layout: GridLayoutItem[]) => void;
  updateWidgetPosition: (id: string | number, position: WidgetPosition) => Promise<void>;
  clearAllWidgets: () => Promise<void>;
  reloadWidgets: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = 'dashboard_layout';

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layout, setLayout] = useState<GridLayoutItem[]>(() => {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const mapWidgetFromBackend = (w: any): DashboardWidget => ({
    id: w.id,
    symbol: w.symbol,
    category: w.category || '',
    widgetType: w.widget_type,
    name: w.name,
    position: {
      x: w.pos_x ?? w.position?.x ?? 0,
      y: w.pos_y ?? w.position?.y ?? 0,
      width: w.width ?? w.position?.width ?? 4,
      height: w.height ?? w.position?.height ?? 3,
    },
    config: w.config ? (typeof w.config === 'string' ? JSON.parse(w.config) : w.config) : {},
    scriptSrc: w.script_src,
    script_src: w.script_src, // Keep both for compatibility
  });

  // Find the next available position for a new widget
  const findNextPosition = (): { x: number; y: number; w: number; h: number } => {
    if (layout.length === 0) {
      return { x: 0, y: 0, w: 4, h: 3 };
    }

    // Find the highest y position
    const maxY = Math.max(...layout.map(item => item.y + item.h));
    
    // Try to place at the top of the next row
    return { x: 0, y: maxY, w: 4, h: 3 };
  };

  // Sync layout with widgets
  useEffect(() => {
    setLayout(prevLayout => {
      // Remove layouts for deleted widgets
      const widgetIds = widgets.map(w => String(w.id));
      let newLayout = prevLayout.filter(l => widgetIds.includes(l.i));
      
      // Add layouts for new widgets
      widgets.forEach(w => {
        if (!newLayout.find(l => l.i === String(w.id))) {
          newLayout.push({
            i: String(w.id),
            x: w.position.x,
            y: w.position.y,
            w: w.position.width,
            h: w.position.height,
            minW: 2,
            minH: 2,
            maxW: 12,
            maxH: 12,
          });
        }
      });
      return newLayout;
    });
  }, [widgets]);

  // Persist layout to localStorage
  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const reloadWidgets = useCallback(async () => {
    try {
      const data = await widgetsApi.getWidgets();
      setWidgets(Array.isArray(data) ? data.map(mapWidgetFromBackend) : []);
    } catch (error) {
      console.error('Error loading widgets:', error);
      setWidgets([]);
    }
  }, []);

  useEffect(() => {
    reloadWidgets();
  }, [reloadWidgets]);

  const addWidget = async (widget: any) => {
    try {
      // Find next available position
      const nextPos = findNextPosition();
      
      // Prepare widget data for backend
      const widgetData = {
        widget_type: widget.widgetType || widget.widget_type,
        symbol: widget.symbol,
        category: widget.category || '',
        name: widget.name,
        script_src: widget.scriptSrc || widget.script_src,
        config: widget.config,
        position: {
          x: nextPos.x,
          y: nextPos.y,
          width: nextPos.w,
          height: nextPos.h
        }
      };

      const newWidget = await widgetsApi.addWidget(widgetData);
      const mappedWidget = mapWidgetFromBackend(newWidget);
      
      setWidgets((prev) => [...prev, mappedWidget]);
      
      // Add to layout
      setLayout((prev) => [
        ...prev,
        {
          i: String(newWidget.id),
          x: nextPos.x,
          y: nextPos.y,
          w: nextPos.w,
          h: nextPos.h,
          minW: 2,
          minH: 2,
          maxW: 12,
          maxH: 12,
        },
      ]);
    } catch (error) {
      console.error('Error adding widget:', error);
      throw error;
    }
  };

  const removeWidget = async (id: string | number) => {
    try {
      await widgetsApi.removeWidget(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setLayout((prev) => prev.filter((l) => l.i !== String(id)));
    } catch (error) {
      console.error('Error removing widget:', error);
      throw error;
    }
  };

  const updateLayout = async (newLayout: GridLayoutItem[]) => {
    setLayout(newLayout);
    
    // Update widget positions based on layout and save to database
    const updatedWidgets = widgets.map((w) => {
      const l = newLayout.find((l) => l.i === String(w.id));
      return l
        ? {
            ...w,
            position: {
              x: l.x,
              y: l.y,
              width: l.w,
              height: l.h,
            },
          }
        : w;
    });
    
    setWidgets(updatedWidgets);
    
    // Save position updates to database
    const positionUpdates = updatedWidgets.map(widget => {
      const l = newLayout.find((l) => l.i === String(widget.id));
      if (l) {
        return widgetsApi.updateWidget(widget.id, {
          position: {
            x: l.x,
            y: l.y,
            width: l.w,
            height: l.h,
          }
        });
      }
      return Promise.resolve();
    });
    
    try {
      await Promise.all(positionUpdates);
    } catch (error) {
      console.error('Error saving widget positions:', error);
    }
  };

  const updateWidgetPosition = async (id: string | number, position: WidgetPosition) => {
    try {
      // Update backend if needed
      // await widgetsApi.updateWidgetPosition(id, position);
      
      setWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, position } : w))
      );
      setLayout((prev) =>
        prev.map((l) =>
          l.i === String(id)
            ? { ...l, x: position.x, y: position.y, w: position.width, h: position.height }
            : l
        )
      );
    } catch (error) {
      console.error('Error updating widget position:', error);
      throw error;
    }
  };

  const clearAllWidgets = async () => {
    try {
      await widgetsApi.clearAllWidgets();
      setWidgets([]);
      setLayout([]);
    } catch (error) {
      console.error('Error clearing widgets:', error);
      throw error;
    }
  };

  return (
    <DashboardContext.Provider value={{ widgets, layout, addWidget, removeWidget, updateLayout, updateWidgetPosition, clearAllWidgets, reloadWidgets }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}; 