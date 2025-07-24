import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Divider,
  Button,
  Popover,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableHead,
} from '@mui/material';
import {
  getTradingViewNews,
  getTradingViewNewsDetail,
  type TvNewsItem,
  type TvNewsDetailResponse,
  type TvNewsAstNode,
} from '../../api/news';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const MARKETS = [
  { key: 'stock', label: 'Stocks' },
  { key: 'etf', label: 'ETFs' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'forex', label: 'Forex' },
  { key: 'indices', label: 'Indices' },
  { key: 'futures', label: 'Futures' },
  { key: 'bond', label: 'Bonds' },
  { key: 'economy', label: 'Economy' },
];

const COUNTRIES = [
    { key: 'entire_world', label: 'Entire world', codes: [] },
    { key: 'g20', label: 'Top 20 economies', codes: ['AR', 'AU', 'BR', 'CA', 'CN', 'DE', 'EU', 'FR', 'GB', 'ID', 'IN', 'IT', 'JP', 'KR', 'MX', 'RU', 'SA', 'TR', 'US', 'ZA'] },
    { key: 'us', label: 'USA', codes: ['US'] },
    { key: 'in', label: 'India', codes: ['IN'] },
    { key: 'de', label: 'Germany', codes: ['DE'] },
    { key: 'jp', label: 'Japan', codes: ['JP'] },
    { key: 'ca', label: 'Canada', codes: ['CA'] },
    { key: 'hk', label: 'Hong Kong, China', codes: ['HK'] },
    { key: 'gb', label: 'United Kingdom', codes: ['GB'] },
    { key: 'tr', label: 'Turkey', codes: ['TR'] },
];

const AstRenderer: React.FC<{ node: TvNewsAstNode | string }> = ({ node }) => {
  if (typeof node === 'string') {
    return <span>{node}</span>;
  }

  const { type, children, ...props } = node;

  const renderChildren = () =>
    children?.map((child, index) => <AstRenderer key={index} node={child} />);

  switch (type) {
    case 'root':
      return <div>{renderChildren()}</div>;
    case 'p':
      // Restore paragraph rendering to create block-level elements,
      // which is essential for correct list formatting.
      return <Typography sx={{ mb: 0.5 }}>{renderChildren()}</Typography>;
    case 'a':
      // Add explicit styling to match the TradingView link style
      return <a href={props.href} target="_blank" rel="noopener noreferrer" style={{ color: '#2962FF', textDecoration: 'none' }}>{renderChildren()}</a>;
    case 'strong':
      return <strong style={{ fontWeight: 600 }}>{renderChildren()}</strong>;
    case 'em':
      return <em>{renderChildren()}</em>;
    case 'ul':
      return <List sx={{ pl: 2, listStyleType: 'disc' }}>{renderChildren()}</List>;
    case 'li':
      return (
        <ListItem sx={{ display: 'list-item', p: 0, ml: 2 }}>
          <Typography component="span" sx={{ fontWeight: 500 }}>
            {renderChildren()}
          </Typography>
        </ListItem>
      );
    case 'table':
      return (
        <TableContainer component={Paper} sx={{ my: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <Table size="small" sx={{ tableLayout: 'auto' }}>
            {renderChildren()}
          </Table>
        </TableContainer>
      );
    case 'table-head':
        return <TableHead>{renderChildren()}</TableHead>;
    case 'table-body':
        return <TableBody>{renderChildren()}</TableBody>;
    case 'table-row':
       // Add a bottom border to all rows except the very last one in the body
      return <TableRow sx={{ '&:last-of-type > td': { border: 0 } }}>{renderChildren()}</TableRow>;
    case 'table-header-cell':
        return (
            <TableCell
              component="th"
              scope="col"
              sx={{
                color: 'text.secondary',
                fontWeight: 400,
                fontSize: '0.875rem',
                py: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                textAlign: 'left', // Explicitly align headers to the left
              }}
            >
              {renderChildren() || <>&nbsp;</>}
            </TableCell>
        );
    case 'table-data-cell':
      return (
        <TableCell sx={{ py: 1.5, px: 2, verticalAlign: 'top', borderBottom: '1px solid', borderColor: 'divider' }}>
          {renderChildren() || <>&nbsp;</>}
        </TableCell>
      );
    default:
      return <span>{renderChildren()}</span>;
  }
};


const NewsTab: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['stock', 'crypto']);
  const [selectedCountryKey, setSelectedCountryKey] = useState<string>('entire_world');
  const [newsItems, setNewsItems] = useState<TvNewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<TvNewsDetailResponse | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketAnchorEl, setMarketAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [countryAnchorEl, setCountryAnchorEl] = useState<HTMLButtonElement | null>(null);
  const selectedItemRef = useRef<HTMLLIElement>(null);
  const initialLoad = React.useRef(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [_, setForceUpdate] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(x => x + 1);
    }, 60000); // update every minute to refresh relative times
    return () => clearInterval(timer);
  }, []);

  const handleNewsItemClick = useCallback(async (item: TvNewsItem) => {
    setLoadingDetail(true);
    setSelectedNews(null);
    try {
      const detail = await getTradingViewNewsDetail(item.id);
      console.log("--- FULL ARTICLE AST ---");
      console.log(JSON.stringify(detail.astDescription, null, 2));
      setSelectedNews(detail);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch news detail.');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    // Clear any existing timer whenever filters change
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    const selectedCountry = COUNTRIES.find(c => c.key === selectedCountryKey);
    const countryCodes = selectedCountry ? selectedCountry.codes : [];

    const getNews = async () => {
        if (selectedMarkets.length === 0) {
          setNewsItems([]);
          return;
        }
        // Only show full-page loader on the very first load
        if (initialLoad.current) {
            setLoadingList(true);
        }
        setError(null);
        
        try {
          const response = await getTradingViewNews(selectedMarkets, countryCodes);
          const sortedItems = response.items?.sort((a, b) => b.published - a.published) || [];
          setNewsItems(sortedItems);

          if (initialLoad.current && sortedItems.length > 0) {
            handleNewsItemClick(sortedItems[0]);
            initialLoad.current = false;
          }

    } catch (err) {
          setError('Failed to fetch news list. Please try again.');
          console.error(err);
    } finally {
            if (loadingList) {
                setLoadingList(false);
            }
            // Schedule the next refresh
            refreshTimerRef.current = setTimeout(getNews, 60000);
        }
    };

    getNews();

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [selectedMarkets, selectedCountryKey, handleNewsItemClick]);
  
  // Scroll to the selected item when it changes
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedNews]);

  const handleMarketChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const market = event.target.name;
    initialLoad.current = true; // Force re-selection of the first item on market change
    setSelectedMarkets((prev) =>
      prev.includes(market) ? prev.filter((m) => m !== market) : [...prev, market]
    );
  };

  const handleCountryChange = (countryKey: string) => {
    initialLoad.current = true;
    setSelectedCountryKey(countryKey);
    setCountryAnchorEl(null);
  };
  
  const formatTimestamp = (timestamp: number) => {
    return dayjs(timestamp * 1000).fromNow();
  };
  
  const openMarketPopover = Boolean(marketAnchorEl);
  const marketPopoverId = openMarketPopover ? 'market-popover' : undefined;

  const openCountryPopover = Boolean(countryAnchorEl);
  const countryPopoverId = openCountryPopover ? 'country-popover' : undefined;

  const selectedCountryLabel = COUNTRIES.find(c => c.key === selectedCountryKey)?.label || 'Entire world';

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', p: 1, gap: 1 }}>

      {/* Left Pane: Filters and News List */}
      <Paper sx={{ width: '350px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <Button
            aria-describedby={marketPopoverId}
            variant="outlined"
            onClick={(event) => setMarketAnchorEl(event.currentTarget)}
            fullWidth
            size="small"
          >
            Market {selectedMarkets.length > 0 && `(${selectedMarkets.length})`}
          </Button>
          <Button
            aria-describedby={countryPopoverId}
            variant="outlined"
            onClick={(event) => setCountryAnchorEl(event.currentTarget)}
            fullWidth
            size="small"
          >
            {selectedCountryLabel}
          </Button>
        </Box>
        <Popover
          id={marketPopoverId}
          open={openMarketPopover}
          anchorEl={marketAnchorEl}
          onClose={() => setMarketAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>MARKET</Typography>
            <FormGroup>
              {MARKETS.map((market) => (
                <FormControlLabel
                  key={market.key}
                  control={
                    <Checkbox
                      checked={selectedMarkets.includes(market.key)}
                      onChange={handleMarketChange}
                      name={market.key}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">{market.label}</Typography>}
                />
              ))}
            </FormGroup>
          </Paper>
        </Popover>
        <Popover
          id={countryPopoverId}
          open={openCountryPopover}
          anchorEl={countryAnchorEl}
          onClose={() => setCountryAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <List dense sx={{ p: 1 }}>
            {COUNTRIES.map((country) => (
              <ListItemButton
                key={country.key}
                selected={selectedCountryKey === country.key}
                onClick={() => handleCountryChange(country.key)}
              >
                <ListItemText primary={<Typography variant="body2">{country.label}</Typography>} />
              </ListItemButton>
            ))}
          </List>
        </Popover>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loadingList && newsItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error && newsItems.length === 0 ? (
            <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>
          ) : (
            <List disablePadding>
              {newsItems.map((item) => {
                 const isSelected = selectedNews?.id === item.id;
                 return (
                  <ListItem
                    key={item.id}
                    disablePadding
                    ref={isSelected ? selectedItemRef : null}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <ListItemButton selected={isSelected} onClick={() => handleNewsItemClick(item)} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{ sx: { fontWeight: isSelected ? 600 : 500, fontSize: '0.875rem' } }}
                        secondary={`${item.provider.name} • ${formatTimestamp(item.published)}`}
                        secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }}
                      />
                    </ListItemButton>
                  </ListItem>
                 );
              })}
            </List>
          )}
        </Box>
      </Paper>

      {/* Right Pane: News Detail */}
      <Paper sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {loadingDetail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error && !selectedNews ? (
          <Box sx={{ p: 2, textAlign: 'center' }}><Typography color="error">{error}</Typography></Box>
        ) : selectedNews ? (
          <>
            <Typography variant="h6" gutterBottom component="h1" sx={{ fontWeight: 'bold' }}>
              {selectedNews.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {selectedNews.provider.name} • {dayjs(selectedNews.published * 1000).fromNow()}
            </Typography>
            <Divider />
            <Box sx={{pt: 1.5}}>
              {selectedNews.astDescription ? (
                <AstRenderer node={selectedNews.astDescription} />
              ) : selectedNews.story ? (
                <Box
                  component="div"
                  dangerouslySetInnerHTML={{ __html: selectedNews.story }}
                  sx={{
                    '& img': { maxWidth: '100%', height: 'auto', borderRadius: '8px' },
                    '& a': { color: 'primary.main', textDecoration: 'none' },
                    '& a:hover': { textDecoration: 'underline' }
                  }}
                />
              ) : (
                 <Typography paragraph sx={{ my: 1.5, fontSize: '1rem', lineHeight: 1.7 }}>
                  {selectedNews.shortDescription || "No detailed content available."}
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography variant="body1" color="text.secondary">
              Select a news item to read
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NewsTab;