import type { DashboardWidget, WidgetPosition } from '../context/DashboardContext';

const API = '/api/widgets';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt');
  if (token) return { Authorization: `Bearer ${token}` };
  return {};
}

export async function getWidgets(): Promise<DashboardWidget[]> {
  const headers = getAuthHeaders();
  const res = await fetch(API, {
    credentials: 'include',
    headers,
  });
  if (!res.ok) throw new Error('Failed to fetch widgets');
  return await res.json();
}

export async function addWidget(widget: Omit<DashboardWidget, 'id'>): Promise<DashboardWidget> {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(API, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(widget),
  });
  if (!res.ok) throw new Error('Failed to add widget');
  return await res.json();
}

export async function removeWidget(id: string | number): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
  if (!res.ok) throw new Error('Failed to remove widget');
}

export async function updateWidget(id: string | number, data: { position?: WidgetPosition; config?: any; name?: string }): Promise<void> {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  
  // Transform position data to match backend expectations
  const requestData: any = { ...data };
  if (data.position) {
    requestData.position = {
      x: data.position.x,
      y: data.position.y,
      width: data.position.width,
      height: data.position.height,
    };
  }
  
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(requestData),
  });
  if (!res.ok) throw new Error('Failed to update widget');
}

export async function clearAllWidgets(): Promise<void> {
  const headers = getAuthHeaders();
  const res = await fetch(API, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });
  if (!res.ok) throw new Error('Failed to clear widgets');
} 