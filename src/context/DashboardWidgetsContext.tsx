// src/context/DashboardWidgetsContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardWidgetState {
  id: string | number;
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
  addWidget: (widget: Omit<DashboardWidgetState, 'id'>) => Promise<void>;
  removeWidget: (id: string | number) => Promise<void>;
  updateWidgetPosition: (id: string | number, position: WidgetPosition) => Promise<void>;
  getWidgetDefinition?: (id: string | number) => DashboardWidgetState | undefined;
  clearAllWidgets: () => Promise<boolean>;
}

const DashboardWidgetsContext = createContext<DashboardWidgetsContextProps | undefined>(undefined);

export const DashboardWidgetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<DashboardWidgetState[]>([]);

  // Helper to get JWT
  const getToken = () => localStorage.getItem("authToken");

  // Track auth token in state and update on login/logout
  const [authToken, setAuthToken] = useState<string | null>(getToken());
  useEffect(() => {
    const updateToken = () => setAuthToken(getToken());
    window.addEventListener('storage', updateToken);
    window.addEventListener('authChanged', updateToken);
    return () => {
      window.removeEventListener('storage', updateToken);
      window.removeEventListener('authChanged', updateToken);
    };
  }, []);

  // Fetch widgets whenever authToken changes
  useEffect(() => {
    if (!authToken) {
      setWidgets([]);
      return;
    }
    const fetchWidgets = async () => {
      const res = await fetch("/api/widgets", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWidgets(data.map((w: any) => ({
          id: w.id,
          widgetType: w.widget_type,
          symbol: w.symbol,
          category: w.category || "",
          name: w.name,
          scriptSrc: w.script_src,
          config: typeof w.config === "string" ? JSON.parse(w.config) : w.config,
          position: {
            x: w.pos_x,
            y: w.pos_y,
            width: w.width,
            height: w.height
          }
        })));
      }
    };
    fetchWidgets();
  }, [authToken]);

  // Add widget
  const addWidget = async (widget: Omit<DashboardWidgetState, 'id'>) => {
    const token = getToken();
    const res = await fetch("/api/widgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        widget_type: widget.widgetType,
        symbol: widget.symbol,
        name: widget.name,
        script_src: widget.scriptSrc,
        config: widget.config,
        position: widget.position
      })
    });
    if (res.ok) {
      const w = await res.json();
      setWidgets(prev => [...prev, {
        id: w.id,
        widgetType: w.widget_type,
        symbol: w.symbol,
        category: w.category || "",
        name: w.name,
        scriptSrc: w.script_src,
        config: typeof w.config === "string" ? JSON.parse(w.config) : w.config,
        position: {
          x: w.pos_x,
          y: w.pos_y,
          width: w.width,
          height: w.height
        }
      }]);
    }
  };

  // Remove widget
  const removeWidget = async (id: string | number) => {
    const token = getToken();
    await fetch(`/api/widgets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  // Update widget position
  const updateWidgetPosition = async (id: string | number, position: WidgetPosition) => {
    const token = getToken();
    await fetch(`/api/widgets/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ position })
    });
    setWidgets(prev =>
      prev.map(w => w.id === id ? { ...w, position } : w)
    );
  };

  // Bulk remove all widgets for the current user
  const clearAllWidgets = async (): Promise<boolean> => {
    const token = getToken();
    const res = await fetch('/api/widgets', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setWidgets([]);
      return true;
    }
    return false;
  };

  const getWidgetDefinition = (id: string | number) => widgets.find(w => w.id === id);

  return (
    <DashboardWidgetsContext.Provider value={{
      widgets,
      addWidget,
      removeWidget,
      updateWidgetPosition,
      getWidgetDefinition,
      clearAllWidgets
    }}>
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