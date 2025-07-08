export interface EconomicEvent {
  date: string;
  time: string;
  utcTime: string | null;
  currency: string;
  event: string;
  impact: string;
  actual: string;
  actualClass?: string;
  actualTitle?: string;
  forecast: string;
  previous: string;
  previousClass?: string;
  previousTitle?: string;
}

export interface CalendarResponse {
  events: EconomicEvent[];
}

const API_BASE = '/api';

export async function getCalendarData(timeframe: string): Promise<CalendarResponse> {
  const params = new URLSearchParams({ timeframe });
  const response = await fetch(`${API_BASE}/calendar?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
  }
  
  return await response.json();
} 