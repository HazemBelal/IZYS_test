import React, { useEffect, useRef } from 'react';

const TradingViewCalendarWidget = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: '100%',
      height: '100%',
      colorTheme: 'light',
      isTransparent: false,
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu',
    });
    container.current?.appendChild(script);

    return () => {
      container.current?.removeChild(script);
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{
        overflow: 'hidden', // Hide overflow to remove scrollbar
        height: '100%', // Ensure the container takes full height
      }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{
          height: '100%', // Ensure the widget takes full height
        }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
};

export default TradingViewCalendarWidget;