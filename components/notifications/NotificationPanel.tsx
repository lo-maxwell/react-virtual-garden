"use client";
import { useState, useEffect } from "react";
import DailyLoginRewardClaimButton from "../eventReward/dailyLogin/dailyLoginRewardClaimButton";
import { useUser } from "@/app/hooks/contexts/UserContext";
import { useAccount } from "@/app/hooks/contexts/AccountContext";
import { DailyLoginRewardFactory } from "@/models/events/dailyLogin/DailyLoginRewardFactory";
import { UserEventTypes } from "@/models/user/userEvents/UserEventTypes";

const BottomLeftNotificationPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);

  const { user } = useUser();
  const { guestMode } = useAccount();

  const togglePanel = () => setIsOpen((prev) => !prev);

  // Check if daily reward is available
  useEffect(() => {
    if (guestMode || !user) {
      setDailyRewardAvailable(false);
      return;
    }
    const dailyEvent = user.getEvent(UserEventTypes.DAILY.name);
    const canClaim = dailyEvent
      ? DailyLoginRewardFactory.canClaimReward(new Date(), dailyEvent)
      : true;
    setDailyRewardAvailable(canClaim);
  }, [user, guestMode]);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start space-y-2">
      {/* Only render the panel when open */}
      {isOpen && (
        <div className="bg-reno-sand-200 border border-coffee-700 rounded-lg shadow-md p-4 flex flex-col gap-3 transform transition-all duration-300 ease-in-out origin-bottom">
          {/* Daily Login Button */}
          <DailyLoginRewardClaimButton />

          {/* Placeholder Message Button */}
          <button
            className="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-300"
            onClick={() => alert("Message feature not implemented yet")}
          >
            Messages
          </button>
        </div>
      )}

      {/* Toggle button - small square icon with alert */}
      <button
        onClick={togglePanel}
        className={`relative w-12 h-12 rounded-md shadow-md flex items-center justify-center transition-colors duration-300 ${
			isOpen
            ? "bg-purple-700 hover:bg-purple-800"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
        aria-label="Notifications"
      >
        🔔
        {/* Exclamation badge */}
        {dailyRewardAvailable && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-yellow-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
            !
          </span>
        )}
      </button>
    </div>
  );
};

export default BottomLeftNotificationPanel;
