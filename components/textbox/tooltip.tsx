'use client'
import React, { useEffect, useState } from 'react';

const Tooltip = ({ children, content, position = 'top', backgroundColor, forceVisible = '', boxWidth = '20vw' }: { children: React.ReactNode, content: React.ReactNode, position: string, backgroundColor: string, forceVisible: string, boxWidth: string}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [tooltipWidth, setTooltipWidth] = useState(boxWidth); // Default value

  useEffect(() => {
    // Update tooltip width on window resize
    const handleResize = () => {
      const newWidth = `${Math.max(Math.min(window.innerWidth * 0.2, 300), 100)}px`; // 20% of viewport width or 400px max
      setTooltipWidth(newWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showTooltip = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { top, left, width, height } = rect;
    
    let tooltipTop, tooltipLeft;

    switch (position) {
      case 'top':
        tooltipTop = top - 10;
        tooltipLeft = left + width / 2;
        break;
      case 'right':
        tooltipTop = top + height / 2;
        tooltipLeft = left + width + 10;
        break;
      case 'bottom':
        tooltipTop = top + height + 10;
        tooltipLeft = left + width / 2;
        break;
      case 'left':
        tooltipTop = top + height / 2;
        tooltipLeft = left - 10;
        break;
      default:
        tooltipTop = top - 10;
        tooltipLeft = left + width / 2;
    }

    setCoords({ top: tooltipTop + window.scrollY, left: tooltipLeft + window.scrollX });
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  return (
    <div
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      className="w-full relative inline-block"
    >
      {children}
      {(forceVisible === 'ON' || (visible && forceVisible !== 'OFF')) && (
        <div
          className={`fixed z-10 px-2 py-1 text-sm text-purple-800 text-semibold ${backgroundColor} rounded shadow-lg
          ${position === 'top' ? 'transform -translate-x-1/2 -translate-y-full' : ''}
          ${position === 'right' ? 'transform -translate-y-1/2' : ''}
          ${position === 'bottom' ? 'transform -translate-x-1/2' : ''}
          ${position === 'left' ? 'transform -translate-y-1/2 -translate-x-full' : ''}`}
          style={{ top: `${coords.top}px`, left: `${coords.left}px`, maxWidth: tooltipWidth, whiteSpace: 'normal'}}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;