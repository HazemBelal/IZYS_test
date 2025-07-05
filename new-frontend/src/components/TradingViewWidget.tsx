import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  id: string | number;
  scriptSrc: string;
  config: any;
}

export function TradingViewWidget({ id, scriptSrc, config }: TradingViewWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Clear previous content
    ref.current.innerHTML = '';

    // Create the wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';

    // Create the placeholder div
    const placeholder = document.createElement('div');
    placeholder.id = `tradingview_${id}`;
    placeholder.className = 'tradingview-widget-container__widget';
    placeholder.style.width = '100%';
    placeholder.style.height = '100%';
    wrapper.appendChild(placeholder);

    // Create the script element
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.type = 'text/javascript';
    script.textContent = JSON.stringify({
      ...config,
      container_id: `tradingview_${id}`,
      width: '100%',
      height: '100%',
    });

    wrapper.appendChild(script);
    ref.current.appendChild(wrapper);
  }, [id, scriptSrc, config]);

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative'
      }}
    />
  );
} 