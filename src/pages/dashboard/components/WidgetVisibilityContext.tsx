// src/pages/dashboard/components/WidgetVisibilityContext.tsx
import React, { createContext, useContext, useState } from "react";

interface WidgetVisibilityContextProps {
  widgetVisibility: Record<string, boolean>;
  setWidgetVisibility: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const WidgetVisibilityContext = createContext<WidgetVisibilityContextProps | undefined>(undefined);

export const useWidgetVisibility = () => {
  const context = useContext(WidgetVisibilityContext);
  if (!context) {
    throw new Error("useWidgetVisibility must be used within a WidgetVisibilityProvider");
  }
  return context;
};

export const WidgetVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgetVisibility, setWidgetVisibility] = useState<Record<string, boolean>>({});
  return (
    <WidgetVisibilityContext.Provider value={{ widgetVisibility, setWidgetVisibility }}>
      {children}
    </WidgetVisibilityContext.Provider>
  );
};
