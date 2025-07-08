import api from '../utils/api';

export interface Symbol {
  id: string;
  symbol: string;
  name: string;
  description?: string;
  type?: string;
  category: string;
  exchange?: string;
  currency?: string;
  country?: string;
  sector?: string;
  industry?: string;
  last_updated?: string;
}

export interface SymbolsResponse {
  symbols: Symbol[];
}

export interface SearchResponse {
  symbols: Symbol[];
}

export interface PaginatedResponse {
  symbols: Symbol[];
  hasMore: boolean;
}

// Fetch symbols by category
export const getSymbolsByCategory = async (category: string): Promise<Symbol[]> => {
  try {
    const response = await api.get<SymbolsResponse>(`/symbols?category=${category}`);
    return response.data.symbols;
  } catch (error) {
    console.error('Error fetching symbols by category:', error);
    return [];
  }
};

// Fetch all symbols
export const getAllSymbols = async (): Promise<Symbol[]> => {
  try {
    const response = await api.get<SymbolsResponse>('/symbols');
    return response.data.symbols;
  } catch (error) {
    console.error('Error fetching all symbols:', error);
    return [];
  }
};

// Search symbols
export const searchSymbols = async (category: string, query: string): Promise<Symbol[]> => {
  try {
    const response = await api.get<SearchResponse>(`/symbols/search?category=${category}&q=${encodeURIComponent(query)}`);
    return response.data.symbols;
  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
};

// Get paginated symbols
export const getPaginatedSymbols = async (category: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse> => {
  try {
    const response = await api.get<PaginatedResponse>(`/symbols/paginated?category=${category}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching paginated symbols:', error);
    return { symbols: [], hasMore: false };
  }
};

// Refresh symbols (admin function)
export const refreshSymbols = async (): Promise<{ success: boolean; count?: number; message?: string }> => {
  try {
    const response = await api.post('/symbols/refresh');
    return response.data as { success: boolean; count?: number; message?: string };
  } catch (error) {
    console.error('Error refreshing symbols:', error);
    return { success: false };
  }
};

// Get symbols with streaming (for real-time updates)
export const getSymbolsStream = (category: string, onData: (symbols: Symbol[]) => void) => {
  const eventSource = new EventSource(`/symbols/stream?category=${category}`);
  
  eventSource.onmessage = (event) => {
    try {
      const symbols = JSON.parse(event.data);
      onData(symbols);
    } catch (error) {
      console.error('Error parsing stream data:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('Symbols stream error:', error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};

// Database response interface for all categories
export interface DatabaseResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: any; // For etfs, futures, bonds, options arrays
}

// Fetch paginated data from database for any category
export const getPaginatedData = async (category: string, page: number = 1, limit: number = 20): Promise<DatabaseResponse> => {
  try {
    const response = await api.get<DatabaseResponse>(`/${category}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${category}:`, error);
    return { total: 0, page: 1, limit: 20, totalPages: 0, [category]: [] };
  }
};

// Legacy ETF functions for backward compatibility
export const getEtfsPaginated = async (page: number = 1, limit: number = 20): Promise<DatabaseResponse> => {
  return getPaginatedData('etfs', page, limit);
};

export const getAllEtfs = async (): Promise<any[]> => {
  try {
    const response = await getEtfsPaginated(1, 1000);
    return response.etfs || [];
  } catch (error) {
    console.error('Error fetching ETFs:', error);
    return [];
  }
};

 