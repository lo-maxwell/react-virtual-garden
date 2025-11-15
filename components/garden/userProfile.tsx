import { useUser } from "@/app/hooks/contexts/UserContext";
import { useState } from "react";
import colors from "../colors/colors";
import GardenDebugOptions from "../developer/GardenDebugOptions";
import LevelSystemComponent from "../level/LevelSystem";
import IconDisplay from "../user/icon/IconDisplay";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ToolboxComponent from "./toolbox/toolbox";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import DailyLoginRewardClaimButton from "../eventReward/dailyLogin/dailyLoginRewardClaimButton";
import "./userProfile.css";

const UserProfileComponent = () => {
  const { user } = useUser();
  const { selectedItem, toggleSelectedItem } = useSelectedItem();

  const levelState = useSelector(
    (state: RootState) =>
      state.userLevelSystem[user.getLevelSystem().getLevelSystemId()]
  );
  let displayLevel = user.getLevel();
  let displayCurrentExp = user.getCurrentExp();
  let displayExpToLevelUp = user.getExpToLevelUp();
  if (levelState) {
    displayLevel = levelState.level;
    displayCurrentExp = levelState.currentExp;
    displayExpToLevelUp = levelState.expToLevelUp;
  }

  return (
    <>
      <div className="flex flex-row items-start justify-left space-x-4">
        {/* Icon */}
        <IconDisplay
          icon={user.getIcon()}
          bgColor="bg-blue-300"
          borderColor="border border-2 border-coffee-700"
          textSize="text-5xl"
          elementSize="16" // fixed height
        />

        {/* Name + Level system stacked vertically */}
        <div className="flex flex-1 flex-col justify-between h-16"> {/* Match icon height */}
          <span
            className={`text-2xl px-1 ${colors.user.usernameTextColor}`} // Hardcode username font size to fit
          >
            {user.getUsername()}
          </span>

          <LevelSystemComponent
            level={displayLevel}
            currentExp={displayCurrentExp}
            expToLevelUp={displayExpToLevelUp}
          />
        </div>
      </div>

    </>
  );
};

export default UserProfileComponent;
