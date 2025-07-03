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

  // Fetch news from the backend based on category and page number
  const fetchNews = async (category: string, page = 1) => {
    setLoading(true);
    setError(null);
    setNews([]); // Clear previous news when switching categories

    try {
      const response = await fetch(`http://localhost:5000/api/news?category=${category}&page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data: NewsResponse = await response.json();
      setNews(data.newsItems);
      setTotalPages(data.totalPages); // Set total pages dynamically from the response
    } catch (error) {
      setError('Error fetching news data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch news details for a specific article
  const fetchNewsDetails = async (url: string) => {
    try {
      const response = await fetch(`/api/news/detail?url=${encodeURIComponent(url)}`);
      const data: NewsDetailsResponse = await response.json();
      setArticleContent((prev) => ({ ...prev, [url]: { content: data.content, image: data.articleImage } }));
    } catch (error) {
      console.error('Error fetching detailed news content:', error);
    }
  };

  // Load default category ("Latest") on component mount
  useEffect(() => {
    fetchNews('latest');
  }, []);

  // Handle category switch and load news for the selected category
  const handleCategoryClick = (category: string) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setCurrentPage(1);
      fetchNews(category);
    } else {
      fetchNews(category); // Refresh same category
    }
  };

  // Handle pagination click
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchNews(selectedCategory, newPage);
    }
  };

  // Generate visible pagination numbers (1-8 static, ..., lastPage)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 8;

    // Show pages 1 to 8 statically
    for (let i = 1; i <= Math.min(maxVisiblePages, totalPages); i++) {
      pages.push(i);
    }

    // Add ellipsis (...) and last page if total pages are greater than 8
    if (totalPages > maxVisiblePages) {
      pages.push("...");
      pages.push(totalPages); // Show the last page
    }

    return pages;
  };

  // Toggle expanded view for an article and fetch detailed content if not already fetched
  const toggleExpand = (url: string) => {
    setExpandedNews((prev) => ({ ...prev, [url]: !prev[url] }));
    if (!articleContent[url]) {
      fetchNewsDetails(url);
    }
  };

  // Function to remove duplicate images from content
  const removeDuplicateImages = (content: string, topImageUrl: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const imgTags = doc.querySelectorAll('img');
    imgTags.forEach((img) => {
      if (img.src === topImageUrl) {
        img.remove();
      }
    });
    return doc.body.innerHTML;
  };

  return (
    <div className="flex justify-center mt-6">
      <div className="w-full md:w-4/5 lg:w-3/5 p-4">
        {/* Category Tab Navigation */}
        <div className="flex space-x-6 border-b pb-4 mb-4 relative">
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
          <div className="relative">
            <button
              className={`text-base font-semibold border-b-4 pb-2 ${
                showMoreDropdown ? 'text-blue-600 border-blue-600' : 'text-gray-600 border-transparent'
              }`}
              onClick={() => setShowMoreDropdown(!showMoreDropdown)}
            >
              More
            </button>
            {showMoreDropdown && (
              <ul className="absolute left-0 top-full mt-2 bg-white shadow-lg border rounded-md">
                {moreSubcategories.map((subcategory) => (
                  <li key={subcategory.value} className="hover:bg-gray-100">
                    <button
                      className="block px-4 py-2 w-full text-left"
                      onClick={() => {
                        handleCategoryClick(subcategory.value);
                        setShowMoreDropdown(false);
                      }}
                    >
                      {subcategory.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* Display news articles */}
        <div className="space-y-8">
          {news.map((item, index) => (
            <div key={item.url || `news-item-${index}`} className="p-4 border rounded-lg shadow-sm bg-white">
              <h2 className="text-lg font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => toggleExpand(item.url)}>
                {item.title}
              </h2>
              {selectedCategory !== 'breaking-news' && item.imageUrl && item.imageUrl !== 'No image available' && (
                <img src={item.imageUrl} alt={item.title} className="w-24 h-24 object-cover my-2" />
              )}
              {item.stockData && item.stockData.length > 0 && (
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
                  {articleContent[item.url]?.image && articleContent[item.url]?.image !== 'No image available' && (
                    <img src={articleContent[item.url].image} alt={item.title} className="w-full h-70 mb-4 object-cover" />
                  )}
                  {articleContent[item.url]?.content ? (
                    <div
                      className="text-gray-700 space-y-4"
                      dangerouslySetInnerHTML={{
                        __html: removeDuplicateImages(articleContent[item.url].content, articleContent[item.url].image),
                      }}
                    />
                  ) : (
                    <p>Loading full article...</p>
                  )}
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Read full article on Investing.com
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {selectedCategory !== 'latest' && selectedCategory !== 'breaking-news' && (
          <div className="flex justify-between items-center my-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 ${currentPage === 1 ? 'text-gray-400' : 'text-blue-600'}`}
            >
              Previous
            </button>
            <div className="flex space-x-2">
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && handlePageChange(page)}
                  className={`px-4 py-2 ${currentPage === page ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 ${currentPage === totalPages ? 'text-gray-400' : 'text-blue-600'}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
