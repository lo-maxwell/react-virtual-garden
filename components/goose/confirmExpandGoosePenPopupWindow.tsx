import React, { useState } from "react";
import { PopupWindow } from "../window/popupWindow";

interface ConfirmExpandGoosePenPopupWindowProps {
  showWindow: boolean;
  setShowWindow: (show: boolean) => void;
  currentSize: number;
  expansionPrice: number;
  onConfirmExpandGoosePen: () => void;
}

export function ConfirmExpandGoosePenPopupWindow({
  showWindow,
  setShowWindow,
  currentSize,
  expansionPrice,
  onConfirmExpandGoosePen,
}: ConfirmExpandGoosePenPopupWindowProps) {

  const handleConfirmExpandGoosePen = () => {
    onConfirmExpandGoosePen();
    setShowWindow(false);
  };

  const handleCancel = () => {
    setShowWindow(false);
  };

  return (
    <PopupWindow showWindow={showWindow} setShowWindow={setShowWindow}>
      <div className="px-4">
        <div className="bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
          <div className="text-2xl font-semibold mb-4 text-center">
            Expand Goose Pen Confirmation
          </div>
          <div className="text-xl mb-6 text-center">
            Expand goose pen to {currentSize + 1} for <span className="font-semibold">{expansionPrice}</span> gold?
          </div>
          <div className="text-sm mb-6 text-center text-gray-600">
            This action cannot be undone.
          </div>

          <div className="flex gap-4 justify-center">
            <button
              className="px-6 py-3 bg-gray-300 text-gray-700 font-medium rounded-lg 
                       hover:bg-gray-400 transition-colors duration-200
                       border-2 border-gray-400"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="px-6 py-3 bg-apple-500 text-white font-medium rounded-lg 
						hover:bg-apple-600 transition-colors duration-200
						border-2 border-apple-600"
              onClick={handleConfirmExpandGoosePen}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </PopupWindow>
  );
}
