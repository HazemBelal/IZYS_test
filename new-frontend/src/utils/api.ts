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
  const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
    localStorage.removeItem('token');
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

export default api; 