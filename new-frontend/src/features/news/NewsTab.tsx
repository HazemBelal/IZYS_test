import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import * as newsApi from '../../api/news';

const CATEGORIES = [
  { label: 'Latest', value: 'latest' },
  { label: 'Breaking News', value: 'breaking-news' },
  { label: 'Cryptocurrency', value: 'cryptocurrency' },
  { label: 'Stock Markets', value: 'stock-markets' },
  { label: 'Commodities', value: 'commodities' },
  { label: 'Currencies', value: 'currencies' },
  { label: 'Economy', value: 'economy' },
  { label: 'Economic Indicators', value: 'economic-indicators' },
  { label: 'Politics', value: 'politics' },
  { label: 'World', value: 'world' },
  { label: 'Company News', value: 'company-news' },
];

const NewsTab: React.FC = () => {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [news, setNews] = useState<newsApi.NewsItem[]>([]);
  const [expanded, setExpanded] = useState<{ [url: string]: boolean }>({});
  const [articleContent, setArticleContent] = useState<{ [url: string]: { content: string; image: string } }>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    newsApi.getNews(category, page)
      .then((data) => {
        setNews(data.newsItems);
        setTotalPages(data.totalPages);
      })
      .finally(() => setLoading(false));
  }, [category, page]);

  const handleExpand = (url: string) => {
    setExpanded((prev) => ({ ...prev, [url]: !prev[url] }));
    if (!articleContent[url]) {
      newsApi.getNewsDetails(url).then((data) => {
        setArticleContent((prev) => ({ ...prev, [url]: data }));
      });
    }
  };

  return (
    <Box>
      <Tabs value={category} onChange={(_, v) => { setCategory(v); setPage(1); }} variant="scrollable" scrollButtons="auto">
        {CATEGORIES.map((cat) => (
          <Tab key={cat.value} label={cat.label} value={cat.value} />
        ))}
      </Tabs>
      <List>
        {loading ? (
          <ListItem><ListItemText primary="Loading..." /></ListItem>
        ) : news.length === 0 ? (
          <ListItem><ListItemText primary="No news found" /></ListItem>
        ) : news.map((item) => (
          <Box key={item.url} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" color="primary" onClick={() => handleExpand(item.url)} sx={{ cursor: 'pointer' }}>{item.title}</Typography>
            {item.imageUrl && item.imageUrl !== 'No image available' && (
              <img src={item.imageUrl} alt={item.title} style={{ width: 120, height: 120, objectFit: 'cover', margin: '8px 0' }} />
            )}
            <Collapse in={!!expanded[item.url]}>
              {articleContent[item.url]?.image && (
                <img src={articleContent[item.url].image} alt={item.title} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', marginBottom: 8 }} />
              )}
              <Typography variant="body2" dangerouslySetInnerHTML={{ __html: articleContent[item.url]?.content || 'Loading...' }} />
              <Button href={item.url} target="_blank" rel="noopener" sx={{ mt: 1 }}>Read full article</Button>
            </Collapse>
          </Box>
        ))}
      </List>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
        <Typography sx={{ mx: 2 }}>{page} / {totalPages}</Typography>
        <Button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
      </Box>
    </Box>
  );
};

export default NewsTab; 