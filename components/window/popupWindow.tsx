import React, { useEffect, useRef } from "react";
import "./popupWindow.css";

export function PopupWindow({
  children,
  showWindow,
  setShowWindow,
}: {
  children: React.ReactNode;
  showWindow: boolean;
  setShowWindow: Function;
}) {
  const popupRef = useRef<HTMLSpanElement>(null);

  const handleClickOutside = (event: any) => {
    if (!showWindow) return;
    const target = event.target as HTMLElement;
    // Use the ref to get the current popup's children-window element
    const childrenWindow = popupRef.current?.querySelector('.children-window');
    // Check if the click occurred outside the target element
    if (childrenWindow && !childrenWindow.contains(target)) {
      setShowWindow(false);
    }
  };

  useEffect(() => {
    // Add event listener when the component mounts
    document.body.addEventListener("click", handleClickOutside);

    // Remove event listener when the component unmounts
    return () => {
      document.body.removeEventListener("click", handleClickOutside);
    };
  }, [showWindow]); // Only re-run the effect if showWindow changes

  return (
    <span
      ref={popupRef}
      className={`${
        showWindow ? `` : `hidden`
      } fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50`}
    >
      <span className="children-window">{children}</span>
    </span>
  );
}
