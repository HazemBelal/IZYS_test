import type { DashboardWidget, WidgetPosition } from '../context/DashboardContext';

const API = '/api/widgets';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getWidgets(): Promise<DashboardWidget[]> {
  const headers = { ...getAuthHeaders() };
  const res = await fetch(API, {
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
    body: JSON.stringify(widget),
  });
  if (!res.ok) {
    let msg = 'Failed to add widget';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return await res.json();
}

export async function removeWidget(id: string | number): Promise<void> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    let msg = 'Failed to remove widget';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {}
    throw new Error(msg);
  }
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
    body: JSON.stringify(requestData),
  });
  if (!res.ok) {
    let msg = 'Failed to update widget';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {}
    throw new Error(msg);
  }
}

export async function clearAllWidgets(): Promise<void> {
  const headers = { ...getAuthHeaders() };
  const res = await fetch(API, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    let msg = 'Failed to clear widgets';
    try {
      const body = await res.json();
      msg = body.error || msg;
    } catch {}
    throw new Error(msg);
  }
} 