// src/pages/dashboard/components/Settings.tsx
import React from "react";
import { useWidgetVisibility } from "./WidgetVisibilityContext";

interface SettingsProps {
  showTicker: boolean;
  setShowTicker: (value: boolean) => void;
}

const Settings: React.FC<SettingsProps> = ({ showTicker, setShowTicker }) => {
  const { widgetVisibility, setWidgetVisibility } = useWidgetVisibility();

  const toggleWidget = (id: string) => {
    setWidgetVisibility((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showTicker}
            onChange={(e) => setShowTicker(e.target.checked)}
            className="mr-2"
          />
          Show Ticker Tape on Top Bar
        </label>
      </div>
      <div>
        <h3 className="font-semibold mb-2">Widget Visibility</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(widgetVisibility).length === 0 ? (
            <p>No widgets available.</p>
          ) : (
            Object.entries(widgetVisibility).map(([id, visible]) => (
              <button
                key={id}
                onClick={() => toggleWidget(id)}
                className={`px-2 py-1 rounded text-xs ${
                  visible ? "bg-blue-500 text-white" : "bg-gray-400 text-gray-800"
                }`}
              >
                {id}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
