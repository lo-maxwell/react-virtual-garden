"use client";
import React from "react";
import colors from "../colors/colors";
import Tooltip from "../window/tooltip";

const LevelSystemComponent = ({
  level,
  currentExp,
  expToLevelUp,
}: {
  level: number;
  currentExp: number;
  expToLevelUp: number;
}) => {
  const progress = Math.min((currentExp / expToLevelUp) * 100, 100);

  return (
    <div className="flex items-center w-full max-w-xs">
      {/* Level Circle */}
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-md z-10 ${colors.level.levelBackgroundColor} ${colors.level.levelTextColor} ${colors.level.levelCircleBorder}`}
        data-testid="current-level"
      >
        {level}
      </div>

      {/* XP Bar with Tooltip */}
      <Tooltip
        content={
          <span className="text-xs font-medium text-white">
            {currentExp} / {expToLevelUp} XP ({progress.toFixed(1)}%)
          </span>
        }
        position="top"
        backgroundColor="bg-black"
        boxWidth="max-content"
      >
        <div
          className={`flex-1 h-8 rounded-r-full overflow-hidden shadow-inner ml-[-16px] ${colors.level.levelXPBarBackgroundColor} ${colors.level.levelXPBarBorder}`}
        >
          <div
            className={`h-full transition-all duration-300 ${colors.level.levelXPBarFilledColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </Tooltip>
    </div>
  );
};

export default LevelSystemComponent;
