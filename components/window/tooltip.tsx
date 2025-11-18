'use client';
import React, { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './tooltip.css';

export type ForceVisibleMode = 'OFF' | 'ON' | 'DEFAULT' | 'INVERSE';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  backgroundColor: string;
  forceVisible?: ForceVisibleMode;
  boxWidth?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  backgroundColor,
  forceVisible = 'DEFAULT',
  boxWidth = '20vw',
  onMouseEnter,
  onMouseLeave,
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [tooltipWidth, setTooltipWidth] = useState(boxWidth);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Track hover state for child and tooltip
  const [childHovered, setChildHovered] = useState(false);
  const [tooltipHovered, setTooltipHovered] = useState(false);
  const [finalPosition, setFinalPosition] = useState(position); // Add state for final position\

  const [dimensions, setDimensions] = useState({ width:0, height: 0 });

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      setDimensions({
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight
      });
    }
  }, []);

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

  const showTooltip = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const { top, left, width, height } = rect;
    
    let tooltipTop: number, tooltipLeft: number;
    switch (finalPosition) {
      case 'top': //We're only using top right now, so didn't bother with the scroll for other cases.
      {
        // First place tooltip above child (temporary — before measuring)
        tooltipTop = top - 10;
        tooltipLeft = left + width / 2;
      
        // Temporarily show tooltip to measure its real height
        setCoords({ top: tooltipTop, left: tooltipLeft });
        setVisible(true);
      
        setTimeout(() => {
          if (!tooltipRef.current) return;
      
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
          // OPTION A: Position ABOVE the child
          const perfectTop = top - tooltipRect.height - 10;
      
          // OPTION B: Position BELOW the child
          const fallbackBottom = top + height + 10;
      
          // Would it go off screen if placed above?
          const goesOffTop = perfectTop < 0;
      
          tooltipTop = goesOffTop ? fallbackBottom : perfectTop;
      
          setCoords({ top: tooltipTop, left: tooltipLeft });
        }, 10);
      
        break;
      }
      case 'right':
        tooltipTop = top + height / 2 ;
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
    setCoords({ top: tooltipTop, left: tooltipLeft });
    setVisible(true);

    // Measure tooltip size after it becomes visible
    setTimeout(() => {
      if (tooltipRef.current) {

        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        // Check if the tooltip goes off the top of the screen
        if (tooltipRect.top - 10 < 0 && finalPosition === 'top') {
          tooltipTop = top + tooltipRect.height + height + 10; // Adjust to show below the element
        } 
        // Check if the tooltip goes off the bottom of the screen
        else if (tooltipRect.bottom > window.innerHeight && finalPosition === 'bottom') {
          tooltipTop = top - tooltipRect.height - 10; // Adjust to show above the element
        }

        if (tooltipRect.left < 10) {
          tooltipLeft = tooltipRect.width/2 + 20;
        }
        else if (tooltipRect.right > window.innerWidth) {
          tooltipLeft = window.innerWidth - tooltipRect.width/2 - 20;
        }

        // Update tooltip coordinates after checking bounds
        setCoords({ top: tooltipTop, left: tooltipLeft });
      }
    }, 10); // Ensure tooltip is rendered before measuring

    if (onMouseEnter) onMouseEnter();
  }, [finalPosition, onMouseEnter]);

  const shouldShow =
    forceVisible === 'ON'
      ? true
      : forceVisible === 'OFF'
      ? false
      : forceVisible === 'INVERSE'
      ? !(childHovered || tooltipHovered)
      : childHovered || tooltipHovered;

  return (
    <>
      <div
        ref={wrapperRef}
        onMouseEnter={(e) => {
          setChildHovered(true);
          showTooltip(e);
        }}
        onMouseLeave={() => setChildHovered(false)}
        className="relative inline-block w-full"
      >
        {children}
      </div>

      {shouldShow &&
        createPortal(
          <div
          ref={tooltipRef}
          onMouseEnter={() => setTooltipHovered(true)}
          onMouseLeave={() => setTooltipHovered(false)}
          className={`fixed z-50 px-2 py-1 text-sm text-purple-800 text-semibold ${backgroundColor} rounded shadow-lg
          ${position === 'top' ? 'transform -translate-x-1/2' : ''}
          ${position === 'right' ? 'transform -translate-y-1/2' : ''}
          ${position === 'bottom' ? 'transform -translate-x-1/2' : ''}
          ${position === 'left' ? 'transform -translate-y-1/2' : ''}
          `}
          style={{ top: `${coords.top}px`, left: `${coords.left}px`, minWidth: `100px`, maxWidth: tooltipWidth, whiteSpace: 'normal'}}
        >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
