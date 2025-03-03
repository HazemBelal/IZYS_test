import React, { useEffect } from 'react';

interface TradingViewWidgetsProps {
  symbol: string;
}

const TradingViewWidgets: React.FC<TradingViewWidgetsProps> = ({ symbol }) => {
  // For testing purposes, force a static symbol
  // Remove or adjust this later when you want to use the dynamic prop.
  const staticSymbol = "NASDAQ:NVDA";

  useEffect(() => {
    console.log("Loading TradingView widgets for:", staticSymbol);

    const updateWidgets = () => {
      const widgets = [
        {
          id: 'symbol-info',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js',
          config: {
            symbol: staticSymbol,
            width: '100%',
            locale: 'en',
            colorTheme: 'light',
            isTransparent: true,
          },
        },
        {
          id: 'advanced-chart',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
          config: {
            autosize: true,
            symbol: staticSymbol,
            interval: 'D',
            timezone: 'Etc/UTC',
            theme: 'light',
            style: '1',
            locale: 'en',
            allow_symbol_change: true,
            calendar: false,
            support_host: 'https://www.tradingview.com',
          },
        },
        {
          id: 'company-profile',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js',
          config: {
            width: '100%',
            height: '100%',
            colorTheme: 'light',
            isTransparent: true,
            symbol: staticSymbol,
            locale: 'en',
          },
        },
        {
          id: 'fundamental-data',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js',
          config: {
            colorTheme: 'light',
            isTransparent: true,
            largeChartUrl: '',
            displayMode: 'adaptive',
            width: '100%',
            height: '100%',
            symbol: staticSymbol,
            locale: 'en',
          },
        },
        {
          id: 'technical-analysis',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js',
          config: {
            interval: '15m',
            width: '100%',
            isTransparent: true,
            height: '100%',
            symbol: staticSymbol,
            showIntervalTabs: true,
            displayMode: 'single',
            locale: 'en',
            colorTheme: 'light',
          },
        },
        {
          id: 'top-stories',
          scriptSrc: 'https://s3.tradingview.com/external-embedding/embed-widget-timeline.js',
          config: {
            feedMode: 'symbol',
            symbol: staticSymbol,
            colorTheme: 'light',
            isTransparent: true,
            displayMode: 'regular',
            width: '100%',
            height: '100%',
            locale: 'en',
          },
        },
      ];

      widgets.forEach((widget) => {
        const container = document.getElementById(widget.id);
        if (container) {
          container.innerHTML = ''; // Clear previous content
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.async = true;
          script.src = widget.scriptSrc;
          // Use script.text for reliability when injecting JSON config
          script.text = JSON.stringify(widget.config);
          script.onload = () =>
            console.log(`Widget ${widget.id} loaded successfully`);
          container.appendChild(script);
        }
      });
    };

    updateWidgets();
  }, [staticSymbol]);

  return (
    <div>
      <nav id="ticker-tape">
        <div className="tradingview-widget-container">
          <div className="tradingview-widget-container__widget"></div>
          <script
            type="text/javascript"
            src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
            async
          >
            {JSON.stringify({
              symbols: [
                { description: '', proName: 'NASDAQ:TSLA' },
                { description: '', proName: 'NASDAQ:AAPL' },
                { description: '', proName: 'NASDAQ:NVDA' },
                { description: '', proName: 'NASDAQ:MSFT' },
                { description: '', proName: 'NASDAQ:AMZN' },
                { description: '', proName: 'NASDAQ:GOOGL' },
                { description: '', proName: 'NASDAQ:META' },
                { description: '', proName: 'NYSE:BRK.B' },
                { description: '', proName: 'NYSE:LLY' },
                { description: '', proName: 'NYSE:UNH' },
                { description: '', proName: 'NYSE:V' },
                { description: '', proName: 'NYSE:WMT' },
              ],
              showSymbolLogo: true,
              colorTheme: 'light',
              isTransparent: false,
              displayMode: 'adaptive',
              locale: 'en',
              largeChartUrl:
                'https://www.tradingview.com/widget-docs/tutorials/build-page/demo/',
            })}
          </script>
        </div>
      </nav>
      <main>
        <section id="symbol-info" className="min-h-[400px] mb-6"></section>
        <section id="advanced-chart" className="min-h-[400px] mb-6"></section>
        <section id="company-profile" className="min-h-[400px] mb-6"></section>
        <section id="fundamental-data" className="min-h-[400px] mb-6"></section>
        <section id="technical-analysis" className="min-h-[400px] mb-6"></section>
        <section id="top-stories" className="min-h-[400px] mb-6"></section>
        <section id="powered-by-tv" className="mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="157" height="21">
            <use href="/widget-docs/tradingview-logo.svg#tradingview-logo"></use>
          </svg>
          <p>
            Charts and financial information provided by TradingView, a popular
            charting &amp; trading platform. Check out even more{' '}
            <a href="https://www.tradingview.com/features/">
              advanced features
            </a>{' '}
            or{' '}
            <a href="https://www.tradingview.com/widget/">
              grab charts
            </a>{' '}
            for your website.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TradingViewWidgets;
