import axios from 'axios';
import type { LoginCredentials, AuthResponse, User, Widget, Symbol, NewsItem, EconomicEvent } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Convert frontend field names to backend expected names
    const backendCredentials = {
      userLogin: credentials.username,
      passLogin: credentials.password
    };
    const response = await api.post('/login', backendCredentials);
    return response.data as AuthResponse;
  },

  register: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Convert frontend field names to backend expected names
    const backendCredentials = {
      username: credentials.username,
      password: credentials.password
    };
    const response = await api.post('/register', backendCredentials);
    return response.data as AuthResponse;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data as User;
  },
};

// Widgets API
export const widgetsAPI = {
  getAll: async (): Promise<Widget[]> => {
    const response = await api.get('/widgets');
    return response.data as Widget[];
  },

  create: async (widget: Omit<Widget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Widget> => {
    const response = await api.post('/widgets', widget);
    return response.data as Widget;
  },

  update: async (id: number, widget: Partial<Widget>): Promise<Widget> => {
    const response = await api.put(`/widgets/${id}`, widget);
    return response.data as Widget;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/widgets/${id}`);
  },

  updatePosition: async (id: number, position: Widget['position']): Promise<Widget> => {
    const response = await api.patch(`/widgets/${id}/position`, { position });
    return response.data as Widget;
  },
};

// Symbols API
export const symbolsAPI = {
  getAll: async (): Promise<Symbol[]> => {
    const response = await api.get('/symbols');
    return response.data as Symbol[];
  },

  getByCategory: async (category: string): Promise<Symbol[]> => {
    const response = await api.get(`/symbols/category/${category}`);
    return response.data as Symbol[];
  },

  search: async (query: string): Promise<Symbol[]> => {
    const response = await api.get(`/symbols/search?q=${encodeURIComponent(query)}`);
    return response.data as Symbol[];
  },
};

// News API
export const newsAPI = {
  getLatest: async (limit: number = 10): Promise<NewsItem[]> => {
    const response = await api.get(`/news?limit=${limit}`);
    return response.data as NewsItem[];
  },

  getByCategory: async (category: string): Promise<NewsItem[]> => {
    const response = await api.get(`/news/category/${category}`);
    return response.data as NewsItem[];
  },
};

// Economic Calendar API
export const calendarAPI = {
  getEvents: async (date?: string): Promise<EconomicEvent[]> => {
    const params = date ? `?date=${date}` : '';
    const response = await api.get(`/calendar${params}`);
    return response.data as EconomicEvent[];
  },

  getUpcoming: async (days: number = 7): Promise<EconomicEvent[]> => {
    const response = await api.get(`/calendar/upcoming?days=${days}`);
    return response.data as EconomicEvent[];
  },
};

// API utility for authenticated requests
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('jwt');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwt');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

// Specific API functions
export const loginUser = async (userLogin: string, passLogin: string) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ userLogin, passLogin }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Login failed');
  }

  return response.json();
};

export const getSymbols = async (category?: string) => {
  const url = category ? `/api/symbols?category=${category}` : '/api/symbols';
  return apiRequest(url);
};

export const getNews = async (category: string = 'latest', page: number = 1) => {
  return apiRequest(`/api/news?category=${category}&page=${page}`);
};

export const getCalendar = async (timeframe: string) => {
  return apiRequest(`/api/calendar?timeframe=${timeframe}`);
};

export default api; 