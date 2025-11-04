import React, { useState } from "react";
import { PopupWindow } from "../window/popupWindow";
import { useAccount } from "@/app/hooks/contexts/AccountContext";

interface ConfirmHarvestAllPopupWindowProps {
  showWindow: boolean;
  setShowWindow: (show: boolean) => void;
  onConfirmHarvestAll: () => void;
}

export function ConfirmHarvestAllPopupWindow({
  showWindow,
  setShowWindow,
  onConfirmHarvestAll,
}: ConfirmHarvestAllPopupWindowProps) {
  const { setConfirmHarvestAll } = useAccount();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConfirmHarvestAll = () => {
    // If user checked "don't ask again", disable the confirmation setting
    if (dontAskAgain) {
      setConfirmHarvestAll(false);
    }
    
    onConfirmHarvestAll();
    setShowWindow(false);
  };

  const handleCancel = () => {
    setShowWindow(false);
  };

  return (
    <PopupWindow showWindow={showWindow} setShowWindow={setShowWindow}>
      <div className="w-max bg-reno-sand-200 text-black p-8 rounded-lg shadow-md justify-between items-center">
        <div className="text-2xl font-semibold mb-4 text-center">
          Harvest All Confirmation
        </div>
        <div className="text-xl mb-6 text-center">
          Are you sure you want to harvest all available plants?
        </div>
        <div className="text-sm mb-6 text-center text-gray-600">
          This action cannot be undone.
        </div>
        
        <div className="flex justify-center items-center gap-3 mb-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            {`Don't ask me again`}
          </label>
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
            className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg 
                       hover:bg-orange-600 transition-colors duration-200
                       border-2 border-orange-600"
            onClick={handleConfirmHarvestAll}
          >
            Harvest
          </button>
        </div>
      </div>
    </PopupWindow>
  );
}
