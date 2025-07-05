import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { getNews, getNewsDetails, type NewsItem, type NewsDetailsResponse } from '../../api/news';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`news-tabpanel-${index}`}
      aria-labelledby={`news-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const newsCategories = [
  { label: 'Latest', value: 'latest' },
  { label: 'Breaking', value: 'breaking-news' },
  { label: 'Crypto', value: 'cryptocurrency' },
  { label: 'Stocks', value: 'stock-markets' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Forex', value: 'currencies' },
  { label: 'Economy', value: 'economy' },
  { label: 'Indicators', value: 'economic-indicators' },
  { label: 'Politics', value: 'politics' },
  { label: 'World', value: 'world' },
  { label: 'Company', value: 'company-news' },
];

const NewsTab: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [articleDetails, setArticleDetails] = useState<NewsDetailsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchNews = async (category: string, page: number = 1) => {
    setLoading(true);
    setError(null);
    setNews([]);

    try {
      const response = await getNews(category, page);
      setNews(response.newsItems);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Failed to fetch news. Please try again.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleDetails = async (url: string) => {
    setDetailsLoading(true);
    try {
      const details = await getNewsDetails(url);
      setArticleDetails(details);
    } catch (err) {
      console.error('Error fetching article details:', err);
      setArticleDetails({ content: 'Failed to load article content.', articleImage: '' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCategoryChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedCategory(newValue);
    setCurrentPage(1);
    const category = newsCategories[newValue].value;
    fetchNews(category, 1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    const category = newsCategories[selectedCategory].value;
    fetchNews(category, page);
  };

  const handleArticleClick = async (article: NewsItem) => {
    setSelectedArticle(article);
    setDialogOpen(true);
    setArticleDetails(null);
    await fetchArticleDetails(article.url);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedArticle(null);
    setArticleDetails(null);
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return 'Unknown time';
    
    // Try to parse the timestamp
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return timestamp; // Return as-is if can't parse
    }
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const removeDuplicateImages = (content: string, topImageUrl: string) => {
    if (!content) return content;
    
    // Simple regex to remove img tags with the same src as topImageUrl
    const imgRegex = new RegExp(`<img[^>]*src=["']${topImageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi');
    return content.replace(imgRegex, '');
  };

  useEffect(() => {
    fetchNews('latest', 1);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Financial News
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 100,
              textTransform: 'none',
              fontWeight: 500,
            },
          }}
        >
          {newsCategories.map((category) => (
            <Tab key={category.value} label={category.label} />
          ))}
        </Tabs>

        <TabPanel value={selectedCategory} index={selectedCategory}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="outlined" 
                onClick={() => fetchNews(newsCategories[selectedCategory].value, currentPage)}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </Box>
          ) : news.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography color="text.secondary">No news available for this category.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
                {news.map((article, index) => (
                  <Card 
                    key={article.url || index} 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    {article.imageUrl && article.imageUrl !== 'No image available' && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={article.imageUrl}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        gutterBottom
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                          lineHeight: 1.3,
                          mb: 2,
                        }}
                        onClick={() => handleArticleClick(article)}
                      >
                        {article.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 2, flexGrow: 1 }}
                      >
                        {article.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatTimestamp(article.timestamp)}
                        </Typography>
                      </Box>

                      {article.author && article.author !== 'Unknown Author' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {article.author}
                          </Typography>
                        </Box>
                      )}

                      {article.stockData && article.stockData.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {article.stockData.slice(0, 3).map((stock, stockIndex) => (
                            <Chip
                              key={stockIndex}
                              label={`${stock.stockName} ${stock.stockChange}`}
                              size="small"
                              color={stock.stockColor === 'green' ? 'success' : 'error'}
                              variant="outlined"
                              icon={stock.stockColor === 'green' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            />
                          ))}
                          {article.stockData.length > 3 && (
                            <Chip
                              label={`+${article.stockData.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button 
                        size="small" 
                        onClick={() => handleArticleClick(article)}
                        sx={{ textTransform: 'none' }}
                      >
                        Read More
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<OpenInNewIcon />}
                        onClick={() => window.open(article.url, '_blank')}
                        sx={{ textTransform: 'none' }}
                      >
                        Open
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </TabPanel>
      </Paper>

      {/* Article Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {selectedArticle && (
            <>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ flex: 1, mr: 2 }}>
                    {selectedArticle.title}
                  </Typography>
                  <IconButton onClick={handleCloseDialog} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatTimestamp(selectedArticle.timestamp)}
                    </Typography>
                  </Box>
                  {selectedArticle.author && selectedArticle.author !== 'Unknown Author' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedArticle.author}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {selectedArticle.stockData && selectedArticle.stockData.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedArticle.stockData.map((stock, stockIndex) => (
                      <Chip
                        key={stockIndex}
                        label={`${stock.stockName} ${stock.stockChange}`}
                        size="small"
                        color={stock.stockColor === 'green' ? 'success' : 'error'}
                        variant="outlined"
                        icon={stock.stockColor === 'green' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {detailsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : articleDetails ? (
                  <Box>
                    {articleDetails.articleImage && articleDetails.articleImage !== 'No image available' && (
                      <Box sx={{ mb: 3, textAlign: 'center' }}>
                        <img 
                          src={articleDetails.articleImage} 
                          alt={selectedArticle.title}
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '400px', 
                            objectFit: 'contain',
                            borderRadius: '8px'
                          }} 
                        />
                      </Box>
                    )}
                    <div
                      dangerouslySetInnerHTML={{
                        __html: removeDuplicateImages(articleDetails.content, articleDetails.articleImage || ''),
                      }}
                      style={{
                        lineHeight: 1.6,
                        fontSize: '16px',
                      }}
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary">Failed to load article content.</Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedArticle && (
            <Button 
              variant="contained" 
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(selectedArticle.url, '_blank')}
            >
              Open Original
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewsTab; 