//new-frontend\src\features\dashboard\WidgetGallery.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import * as symbolsApi from '../../api/symbols';
import { useDashboard } from '../../context/DashboardContext';
import { useDebounce } from '../../hooks/useDebounce';

// TradingView market categories available for widgets
// These map to TradingView Screener API markets:
// - forex: Foreign exchange pairs
// - crypto: Cryptocurrencies  
// - stocks: US stocks (america market)
// - futures: Futures contracts
// - bonds: Government and corporate bonds
// - etfs: Exchange-traded funds (filtered from america market)
// - options: Options contracts
// - indices: Market indices
const CATEGORIES = [
  { label: 'Forex', value: 'forex' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Stocks', value: 'stocks' },
  { label: 'Futures', value: 'futures' },
  { label: 'Bonds', value: 'bonds' },
  { label: 'ETFs', value: 'etfs' },
];

// Widget definitions per category (preserved from your logic)
const getWidgetDefinitions = (symbol: string, category: string, underlyingSymbol?: string) => {
  if (!symbol) return [];
  switch (category) {
    case "stocks":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: 960,
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
          config: {
            autosize: true,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
          },
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: 960,
            height: 390,
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "fundamental-data",
          name: "Fundamental Data",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
          config: {
            colorTheme: "light",
            isTransparent: true,
            largeChartUrl: "",
            displayMode: "adaptive",
            width: 960,
            height: 490,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 1150, width: 960, height: 490 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 1660, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
          config: {
            feedMode: "symbol",
            symbol: symbol,
            colorTheme: "light",
            isTransparent: true,
            displayMode: "regular",
            width: 460,
            height: 425,
            locale: "en",
          },
          default: { x: 480, y: 1660, width: 460, height: 425 }
        }
      ];
    case "crypto":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: 960,
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
          config: {
            autosize: true,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
          },
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: 960,
            height: 390,
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 1150, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
          config: {
            feedMode: "symbol",
            symbol: symbol,
            colorTheme: "light",
            isTransparent: true,
            displayMode: "regular",
            width: 460,
            height: 425,
            locale: "en",
          },
          default: { x: 480, y: 1150, width: 460, height: 425 }
        },
        {
          id: "crypto-coins-heatmap",
          name: "Coins Heatmap",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js",
          config: {
            width: 460,
            height: 400,
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 0, y: 1600, width: 460, height: 400 }
        },
        {
          id: "cryptocurrency-market",
          name: "Crypto Market",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-cryptocurrency-market.js",
          config: {
            width: 460,
            height: 400,
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 480, y: 1600, width: 460, height: 400 }
        }
      ];
    case "forex":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: 960,
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
          config: {
            autosize: true,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
          },
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "Company Profile",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: 960,
            height: 390,
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 1150, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
          config: {
            feedMode: "symbol",
            symbol: symbol,
            colorTheme: "light",
            isTransparent: true,
            displayMode: "regular",
            width: 460,
            height: 425,
            locale: "en",
          },
          default: { x: 480, y: 1150, width: 460, height: 425 }
        },
        {
          id: "economic-calendar",
          name: "Economic Calendar",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
          config: {
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
            countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
            importanceFilter: "-1,0,1",
            width: 960,
            height: 550,
          },
          default: { x: 0, y: 1600, width: 960, height: 550 }
        },
        {
          id: "forex-cross-rates",
          name: "Forex Cross Rates",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js",
          config: {
            width: 960,
            height: 400,
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
          },
          default: { x: 0, y: 2170, width: 960, height: 400 }
        }
      ];
    case "futures":
      return [
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 0, width: 460, height: 425 }
        },
        {
          id: "economic-calendar",
          name: "Economic Calendar",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
          config: {
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
            countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
            importanceFilter: "-1,0,1",
            width: 460,
            height: 550,
          },
          default: { x: 480, y: 0, width: 460, height: 550 }
        }
      ];
    case "bonds":
      return [
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 0, width: 460, height: 425 }
        },
        {
          id: "economic-calendar",
          name: "Economic Calendar",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
          config: {
            colorTheme: "light",
            isTransparent: true,
            locale: "en",
            countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
            importanceFilter: "-1,0,1",
            width: 460,
            height: 550,
          },
          default: { x: 480, y: 0, width: 460, height: 550 }
        }
      ];
    case "etfs":
      return [
        {
          id: "symbol-info",
          name: "Symbol Info",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js",
          config: {
            symbol: symbol,
            width: 960,
            locale: "en",
            colorTheme: "light",
            isTransparent: true,
          },
          default: { x: 0, y: 0, width: 960, height: 200 }
        },
        {
          id: "advanced-chart",
          name: "Advanced Chart",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
          config: {
            autosize: true,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
          },
          default: { x: 0, y: 220, width: 960, height: 500 }
        },
        {
          id: "company-profile",
          name: "ETF Profile",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js",
          config: {
            width: 960,
            height: 390,
            colorTheme: "light",
            isTransparent: true,
            symbol: symbol,
            locale: "en",
          },
          default: { x: 0, y: 740, width: 960, height: 390 }
        },
        {
          id: "technical-analysis",
          name: "Technical Analysis",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js",
          config: {
            interval: "15m",
            width: 460,
            isTransparent: true,
            height: 425,
            symbol: symbol,
            showIntervalTabs: true,
            displayMode: "single",
            locale: "en",
            colorTheme: "light",
          },
          default: { x: 0, y: 1150, width: 460, height: 425 }
        },
        {
          id: "top-stories",
          name: "Top Stories",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
          config: {
            feedMode: "symbol",
            symbol: symbol,
            colorTheme: "light",
            isTransparent: true,
            displayMode: "regular",
            width: 460,
            height: 425,
            locale: "en",
          },
          default: { x: 480, y: 1150, width: 460, height: 425 }
        },
        {
          id: "etf-heatmap",
          name: "ETF Heatmap",
          script_src: "https://s3.tradingview.com/external-embedding/embed-widget-etf-heatmap.js",
          config: {
            dataSource: "AllUSEtf",
            blockSize: "volume",
            blockColor: "change",
            grouping: "asset_class",
            locale: "en",
            symbolUrl: "",
            colorTheme: "light",
            hasTopBar: false,
            isDataSetEnabled: false,
            isZoomEnabled: true,
            hasSymbolTooltip: true,
            isMonoSize: false,
            width: 960,
            height: 400,
            isTransparent: true,
          },
          default: { x: 0, y: 1600, width: 960, height: 400 }
        }
      ];


    default:
      return [];
  }
};

const WidgetGallery: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [selectedSymbol, setSelectedSymbol] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addWidget } = useDashboard();
  


  // Utility function to deduplicate symbols by ID
  const deduplicateSymbols = (symbolsArray: any[]): any[] => {
    const seen = new Set();
    return symbolsArray.filter(sym => {
      if (seen.has(sym.id)) {
        return false;
      }
      seen.add(sym.id);
      return true;
    });
  };

  // Reset on category/search change
  useEffect(() => {
    setSelectedSymbol(null);
    setSymbols([]);
    setSearch('');
    setPage(1);
    setHasMore(true);
    

  }, [category]);

  // Fetch symbols (paginated)
  useEffect(() => {
    let ignore = false;
    const fetchSymbols = async () => {
      setLoading(true);
      try {
        if (['etfs', 'futures', 'bonds'].includes(category)) {
          // Use database-based endpoints for these categories
          const response = await symbolsApi.getPaginatedData(category, 1, 20);
          if (!ignore) {
            const dataArray = response[category] || [];
            setSymbols(dataArray.map((item: any, idx: number) => ({
              id: item.id || item.symbol || idx,
              symbol: item.symbol,
              name: item.name,
              description: item.description || item.name,
              exchange: item.exchange,
              category: category,
            })));
            setHasMore(response.page < response.totalPages);
            setPage(1);
          }
        } else if (debouncedSearch.length > 1) {
          const results = await symbolsApi.searchSymbols(category, debouncedSearch);
          if (!ignore) {
            setSymbols(deduplicateSymbols(results));
            setHasMore(false);
          }
        } else {
          const { symbols: newSymbols, hasMore } = await symbolsApi.getPaginatedSymbols(category, 1);
          if (!ignore) {
            setSymbols(deduplicateSymbols(newSymbols));
            setHasMore(hasMore);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSymbols();
    return () => { ignore = true; };
  }, [category, debouncedSearch]);

  // Infinite scroll handler with debouncing
  const handleScroll = useCallback(() => {
    if (!listRef.current || loadingMore || !hasMore || search.length > 1) return;
    
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Debounce the API call
      scrollTimeoutRef.current = setTimeout(() => {
        setLoadingMore(true);
        
        if (['etfs', 'futures', 'bonds'].includes(category)) {
          // Handle database-based category pagination
          symbolsApi.getPaginatedData(category, page + 1, 20)
            .then((response) => {
              const dataArray = response[category] || [];
              if (dataArray && dataArray.length > 0) {
                setSymbols((prev) => {
                  // Combine existing and new symbols, then deduplicate
                  const newSymbols = dataArray.map((item: any, idx: number) => ({
                    id: item.id || item.symbol || `${page + 1}-${idx}`,
                    symbol: item.symbol,
                    name: item.name,
                    description: item.description || item.name,
                    exchange: item.exchange,
                    category: category,
                  }));
                  const combined = [...prev, ...newSymbols];
                  return deduplicateSymbols(combined);
                });
                setPage((p) => p + 1);
                setHasMore(response.page < response.totalPages);
              } else {
                setHasMore(false);
              }
            })
            .catch((error: any) => {
              console.error(`Error loading more ${category}:`, error);
              setHasMore(false);
            })
            .finally(() => {
              setLoadingMore(false);
            });
        } else {
          // Handle other categories
        symbolsApi.getPaginatedSymbols(category, page + 1)
          .then(({ symbols: more, hasMore: moreHasMore }: { symbols: any[], hasMore: boolean }) => {
            if (more && more.length > 0) {
              setSymbols((prev) => {
                // Combine existing and new symbols, then deduplicate
                const combined = [...prev, ...more];
                return deduplicateSymbols(combined);
              });
              setPage((p) => p + 1);
              setHasMore(moreHasMore);
            } else {
              setHasMore(false);
            }
          })
          .catch((error: any) => {
            console.error('Error loading more symbols:', error);
            setHasMore(false);
          })
          .finally(() => {
            setLoadingMore(false);
          });
        }
      }, 150); // 150ms debounce
    }
  }, [category, page, hasMore, loadingMore, search.length, deduplicateSymbols]);

  useEffect(() => {
    const ref = listRef.current;
    if (!ref) return;
    ref.addEventListener('scroll', handleScroll);
    return () => { 
      ref.removeEventListener('scroll', handleScroll);
      // Cleanup timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  const widgets = selectedSymbol ? getWidgetDefinitions(selectedSymbol.symbol, category, selectedSymbol.underlying) : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Browse Markets & Add Widgets</DialogTitle>
      <DialogContent>
        <Tabs value={category} onChange={(_, v) => setCategory(v)} sx={{ mb: 2 }}>
          {CATEGORIES.map((cat) => (
            <Tab key={cat.value} label={cat.label} value={cat.value} />
          ))}
        </Tabs>
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box sx={{ flex: 1 }}>

            <TextField
              label="Search symbols"
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <List ref={listRef} sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {loading ? (
                <ListItem><ListItemText primary="Loading..." /></ListItem>
              ) : symbols.length === 0 ? (
                <ListItem><ListItemText primary="No symbols found" /></ListItem>
              ) : (
                symbols.map((sym) => (
                  <ListItem key={sym.id} disablePadding>
                    <ListItemButton
                      selected={selectedSymbol?.id === sym.id}
                      onClick={() => setSelectedSymbol(sym)}
                    >
                      <ListItemText
                        primary={sym.symbol}
                        secondary={sym.description || sym.name}
                        secondaryTypographyProps={{ sx: { whiteSpace: 'pre-line', wordBreak: 'break-word' } }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              )}
              {hasMore && !loading && (
                <ListItem sx={{ justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </ListItem>
              )}
            </List>
          </Box>
          <Box sx={{ flex: 2 }}>
            {selectedSymbol ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedSymbol.symbol} - {selectedSymbol.name}
                </Typography>
                <List>
                  {widgets.map((w) => (
                    <ListItem key={w.id} sx={{ alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">{w.name}</Typography>
                        <Typography variant="body2" color="text.secondary">Widget: {w.id}</Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={async () => {
                          // Validate that a symbol is selected
                          if (!selectedSymbol || !selectedSymbol.symbol || typeof selectedSymbol.symbol !== 'string' || !selectedSymbol.symbol.trim()) {
                            alert('Please select a valid symbol before adding this widget.');
                            return;
                          }
                          // Log config for debugging
                          console.log('Adding widget with config:', w.config);
                          // Find a non-overlapping position
                          const offset = 40 * widgets.length;
                          const newPosition = {
                            ...w.default,
                            x: w.default.x + offset,
                            y: w.default.y + offset,
                          };
                          await addWidget({
                            symbol: selectedSymbol.symbol,
                            category,
                            widget_type: w.id,
                            name: w.name,
                            position: newPosition,
                            config: w.config,
                            script_src: w.script_src,
                          });
                          onClose();
                        }}
                      >
                        Add to Dashboard
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Select a symbol to see available widgets.
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default WidgetGallery; 
