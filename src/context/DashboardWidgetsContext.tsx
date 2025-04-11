// src/context/DashboardWidgetsContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidgetState {
  id: string;
  widgetType: string;
  symbol: string;
  category: string;
  name: string;
  scriptSrc: string;
  config: Record<string, any>;
  position: WidgetPosition;
}

interface DashboardWidgetsContextProps {
  widgets: DashboardWidgetState[];
  addWidget: (widget: Omit<DashboardWidgetState, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidgetPosition: (id: string, position: WidgetPosition) => void;
  getWidgetDefinition?: (id: string) => DashboardWidgetState | undefined;
}

const DashboardWidgetsContext = createContext<DashboardWidgetsContextProps | undefined>(undefined);

export const DashboardWidgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const STORAGE_KEY = "dashboard-widgets-v3";

  const [widgets, setWidgets] = useState<DashboardWidgetState[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Failed to parse stored widgets:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
      console.error("Failed to save widgets:", error);
    }
  }, [widgets]);

  const addWidget = (widget: Omit<DashboardWidgetState, 'id'>) => {
    const newWidget: DashboardWidgetState = {
      ...widget,
      id: `widget-${widget.widgetType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWidgetPosition = (id: string, position: WidgetPosition) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position } : w))
    );
  };

  const getWidgetDefinition = (id: string) => {
    return widgets.find((w) => w.id === id);
  };

  return (
    <DashboardWidgetsContext.Provider 
      value={{ 
        widgets, 
        addWidget, 
        removeWidget, 
        updateWidgetPosition,
        getWidgetDefinition
      }}
    >
      {children}
    </DashboardWidgetsContext.Provider>
  );
};

export const useDashboardWidgets = () => {
  const context = useContext(DashboardWidgetsContext);
  if (!context) {
    throw new Error("useDashboardWidgets must be used within a DashboardWidgetsProvider");
  }
  return context;
};