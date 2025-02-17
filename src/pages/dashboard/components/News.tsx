import React, { useState, useEffect } from 'react';

interface StockData {
  stockName: string;
  stockChange: string;
  stockColor: string;
}

interface NewsItem {
  title: string;
  url: string;
  imageUrl: string;
  description: string;
  author: string;
  timestamp: string;
  stockData?: StockData[];
}

interface NewsResponse {
  newsItems: NewsItem[];
  totalPages: number;
}

interface NewsDetailsResponse {
  content: string;
  articleImage: string;
}

const API_BASE_URL = 'http://localhost:5000';

const categories = [
  { label: 'Latest', value: 'latest' },
  { label: 'Breaking News', value: 'breaking-news' },
  { label: 'Cryptocurrency', value: 'cryptocurrency' },
  { label: 'Stock Markets', value: 'stock-markets' },
];

const moreSubcategories = [
  { label: 'Commodities', value: 'commodities' },
  { label: 'Currencies', value: 'currencies' },
  { label: 'Economy', value: 'economy' },
  { label: 'Economic Indicators', value: 'economic-indicators' },
  { label: 'Politics', value: 'politics' },
  { label: 'World', value: 'world' },
  { label: 'Company News', value: 'company-news' },
];

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNews, setExpandedNews] = useState<{ [key: string]: boolean }>({});
  const [articleContent, setArticleContent] = useState<{ [key: string]: { content: string; image: string } }>({});
  const [selectedCategory, setSelectedCategory] = useState('latest');
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNews = async (category: string, page = 1) => {
    setLoading(true);
    setError(null);
    setNews([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/news?category=${category}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      
      const data: NewsResponse = await response.json();
      setNews(data.newsItems);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError('Error fetching news data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsDetails = async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news/detail?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to fetch news details');
      
      const data: NewsDetailsResponse = await response.json();
      setArticleContent((prev) => ({ ...prev, [url]: { content: data.content, image: data.articleImage } }));
    } catch (error) {
      console.error('Error fetching detailed news content:', error);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const handleCategoryClick = (category: string) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setCurrentPage(1);
      fetchNews(category);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchNews(selectedCategory, newPage);
    }
  };

  const toggleExpand = (url: string) => {
    setExpandedNews((prev) => ({ ...prev, [url]: !prev[url] }));
    if (!articleContent[url]) fetchNewsDetails(url);
  };

  return (
    <div className="flex justify-center mt-6">
      <div className="w-full md:w-4/5 lg:w-3/5 p-4">
        <div className="flex space-x-6 border-b pb-4 mb-4">
          {categories.map((category) => (
            <button
              key={category.value}
              className={`text-base font-semibold border-b-4 pb-2 ${
                selectedCategory === category.value ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'
              }`}
              onClick={() => handleCategoryClick(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="space-y-8">
          {news.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
              <h2 className="text-lg font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => toggleExpand(item.url)}>
                {item.title}
              </h2>
              {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-24 h-24 object-cover my-2" />}
              {item.stockData?.length && (
                <div className="flex mt-2 space-x-4 text-sm">
                  {item.stockData.map((stock, stockIndex) => (
                    <span key={stockIndex}>
                      <span className="font-semibold">{stock.stockName}</span>{' '}
                      <span className={stock.stockColor === 'green' ? 'text-green-600' : 'text-red-600'}>
                        {stock.stockChange}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              {expandedNews[item.url] && (
                <div className="mt-4">
                  {articleContent[item.url]?.image && <img src={articleContent[item.url].image} alt={item.title} className="w-full h-70 mb-4 object-cover" />}
                  <div className="text-gray-700 space-y-4" dangerouslySetInnerHTML={{ __html: articleContent[item.url]?.content || 'No content available' }} />
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Read full article on Investing.com</a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default News;
