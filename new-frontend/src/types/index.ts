export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Widget {
  id: number;
  userId: number;
  type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: Record<string, any>;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Symbol {
  id: number;
  symbol: string;
  name: string;
  category: string;
  exchange?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface EconomicEvent {
  id: number;
  title: string;
  country: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  currency?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
} 