import React, { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "./popupWindow.css";
import { getPortals } from "./portalRegistry";

export function PopupWindow({
  children,
  showWindow,
  setShowWindow,
  zValue = 50
}: {
  children: React.ReactNode;
  showWindow: boolean;
  setShowWindow: Function;
  zValue?: number;
}) {
  const popupRef = useRef<HTMLSpanElement>(null);

  const handleClickOutside = useCallback((event: any) => {
    if (!showWindow) return;
    const target = event.target as HTMLElement;
    if (target.closest('.tooltip-portal')) return; // Matches your tooltip classes
    if (target.closest('[class*="tooltip"]') || target.closest('.tooltip')) return;
    // Use the ref to get the current popup's children-window element
    const childrenWindow = popupRef.current?.querySelector('.children-window');
    // Click inside popup content? ignore
    if (childrenWindow && childrenWindow.contains(target)) return;

    const allChildrenWindows = Array.from(document.querySelectorAll('.children-window'));
      for (const window of allChildrenWindows) {
      if (window !== childrenWindow && window.contains(target)) {
        return;
      }
    }

    // Click inside any registered portal? ignore
    for (const portal of getPortals()) {
      if (portal.contains(target)) return;
    }
    setShowWindow(false);
  }, [showWindow, setShowWindow]);

  useEffect(() => {
    // Add event listener when the component mounts
    document.body.addEventListener("mousedown", handleClickOutside);

    // Remove event listener when the component unmounts
    return () => {
      document.body.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]); // Now includes handleClickOutside in dependencies

  return createPortal(
    <span
      ref={popupRef}
      style={{ zIndex: zValue }}
      className={`${showWindow ? `` : `hidden`
        } fixed inset-0 flex items-center justify-center bg-black bg-opacity-50`}
    >
      <div
        className="children-window popup-content relative"
        style={{ zIndex: zValue + 1 }}
      >{children}</div>
    </span>,
    document.body
  );
}
