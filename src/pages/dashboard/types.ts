export interface WidgetPosition {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface DashboardWidgetState {
    id: string;
    position: WidgetPosition;
    scriptSrc: string;
    config: Record<string, any>;
    name: string;
    widgetType: string;
  }
  
  // Add other shared types here