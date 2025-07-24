import api from '../utils/api';

// Interface for a single news item from the old API
export interface NewsItem {
  title: string;
  url: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  author: string;
  publishDate: string;
  stockData?: Array<{
    stockName: string;
    stockChange: string;
    stockColor: string;
  }>;
}

// Interface for the response from the old API
export interface NewsResponse {
  newsItems: NewsItem[];
  totalPages: number;
}

// Interface for a news article detail from the old API
export interface NewsDetail {
  content: string;
  articleImage: string;
}

// --- NEW TradingView API Interfaces ---

export interface TvNewsAstNode {
  type: string;
  children?: (TvNewsAstNode | string)[];
  // Other potential properties like 'href' for links
  [key: string]: any;
}

export interface TvNewsItem {
  id: string;
  title: string;
  shortDescription?: string;
  astDescription?: TvNewsAstNode;
  story?: string; // Some articles may still use plain HTML
  published: number;
  provider: {
    id: string;
    name: string;
    logo_id: string;
  };
  storyPath: string;
  relatedSymbols?: Array<{ symbol: string; logoid: string }>;
}

export interface TvNewsListResponse {
  items: TvNewsItem[];
  streaming?: {
    channel: string;
  };
}

export interface TvNewsDetailResponse {
  id: string;
  title: string;
  shortDescription?: string;
  astDescription?: TvNewsAstNode;
  story: string; // This is the HTML content of the article
  published: number;
  provider: {
    id: string;
    name: string;
    logo_id: string;
  };
  relatedSymbols?: Array<{ symbol: string; logoid: string }>;
}


// --- NEW API Functions ---

/**
 * Fetches the news list from the TradingView API.
 * @param {string[]} markets - An array of market categories (e.g., ['stock', 'etf']).
 * @param {string[]} [countries] - Optional array of country codes (e.g., ['US', 'IN']).
 */
export const getTradingViewNews = async (markets: string[], countries?: string[]): Promise<TvNewsListResponse> => {
  try {
    const params = new URLSearchParams();
    if (markets.length > 0) {
      params.append('markets', markets.join(','));
    }
    if (countries && countries.length > 0) {
      params.append('market_country', countries.join(','));
    }
    // Add a cache-busting parameter
    params.append('_', new Date().getTime().toString());
    
    const response = await api.get<TvNewsListResponse>(`/news?${params.toString()}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching TradingView news:', err);
    const error = err as any; // Type assertion
    throw new Error('Failed to fetch TradingView news: ' + (error.response?.data?.message || error.message));
  }
};

/**
 * Fetches the detail of a single news story from the TradingView API.
 * @param {string} storyId - The unique ID of the story.
 */
export const getTradingViewNewsDetail = async (storyId: string): Promise<TvNewsDetailResponse> => {
  try {
    const response = await api.get<TvNewsDetailResponse>(`/news/detail?storyId=${encodeURIComponent(storyId)}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching TradingView news detail:', err);
    const error = err as any; // Type assertion
    throw new Error('Failed to fetch TradingView news detail: ' + (error.response?.data?.message || error.message));
  }
};



// --- DEPRECATED: Old News Functions ---

/**
 * @deprecated The /api/news endpoint has been updated. Use getTradingViewNews instead.
 */
export const getNews = async (category = 'latest', page = 1): Promise<NewsResponse> => {
  try {
    const response = await api.get<NewsResponse>(`/news?category=${category}&page=${page}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching news:', err);
    const error = err as any; // Type assertion
    throw new Error('Failed to fetch news: ' + (error.response?.data?.error || error.message));
  }
};

/**
 * @deprecated The /api/news/detail endpoint has been updated. Use getTradingViewNewsDetail instead.
 */
export const getNewsDetail = async (url: string): Promise<NewsDetail> => {
  try {
    const response = await api.get<NewsDetail>(`/news/detail?url=${encodeURIComponent(url)}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching news detail:', err);
    const error = err as any; // Type assertion
    throw new Error('Failed to fetch news detail: ' + (error.response?.data?.error || error.message));
  }
}; 