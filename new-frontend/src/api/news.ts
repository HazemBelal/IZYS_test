export interface StockData {
  stockName: string;
  stockChange: string;
  stockColor: string;
}

export interface NewsItem {
  title: string;
  url: string;
  imageUrl: string;
  description: string;
  author: string;
  timestamp: string;
  stockData?: StockData[];
}

export interface NewsResponse {
  newsItems: NewsItem[];
  totalPages: number;
}

export interface NewsDetailsResponse {
  content: string;
  articleImage: string;
}

const API_BASE = '/api';

export async function getNews(category: string, page: number = 1): Promise<NewsResponse> {
  const params = new URLSearchParams({ category, page: page.toString() });
  const response = await fetch(`${API_BASE}/news?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function getNewsDetails(url: string): Promise<NewsDetailsResponse> {
  const params = new URLSearchParams({ url });
  const response = await fetch(`${API_BASE}/news/detail?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch news details: ${response.statusText}`);
  }
  
  return await response.json();
} 