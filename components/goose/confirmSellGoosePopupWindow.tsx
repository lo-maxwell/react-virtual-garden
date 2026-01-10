import React, { useState } from "react";
import { PopupWindow } from "../window/popupWindow";
import { useAccount } from "@/app/hooks/contexts/AccountContext";

interface ConfirmSellGoosePopupWindowProps {
  showWindow: boolean;
  setShowWindow: (show: boolean) => void;
  gooseName: string;
  goosePrice: number;
  onConfirmSellGoose: () => Promise<void>;
}

export function ConfirmSellGoosePopupWindow({
  showWindow,
  setShowWindow,
  gooseName = "this goose",
  goosePrice,
  onConfirmSellGoose,
}: ConfirmSellGoosePopupWindowProps) {

  const handleConfirmSellGoose = async (e: React.MouseEvent) => {
	e.stopPropagation();
    await onConfirmSellGoose();
    setShowWindow(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
	e.stopPropagation();
    setShowWindow(false);
  };

  return (
    <PopupWindow showWindow={showWindow} setShowWindow={setShowWindow} zValue={200}>
      <div className="px-4">
        <div className="bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
          <div className="text-2xl font-semibold mb-4 text-center">
            Sell Goose Confirmation
          </div>
          <div className="text-xl mb-6 text-center">
            Are you sure you want to sell <span className="font-semibold">{gooseName}</span> for <span className="font-semibold">{goosePrice}</span> gold?
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
              className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg 
						hover:bg-red-600 transition-colors duration-200
						border-2 border-red-600"
              onClick={handleConfirmSellGoose}
            >
              Sell
            </button>
          </div>
        </div>
      </div>
    </PopupWindow>
  );
}
