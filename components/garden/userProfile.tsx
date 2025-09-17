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
import EventRewardPopupWindow from "../eventReward/eventRewardPopupWindow";
import { EventReward } from "@/models/events/EventReward";
import DailyLoginRewardClaimButton from "../eventReward/dailyLogin/dailyLoginRewardClaimButton";

const UserProfileComponent = () => {
	const { user } = useUser();
	const { selectedItem, toggleSelectedItem } = useSelectedItem();

	const [showDebugOptions, setShowDebugOptions] = useState(0);

	const getUsernameFontSize = () => {
		if (user.getUsername().length > 20) {
			return 'text-base';
		} else if (user.getUsername().length > 16) {
			return 'text-lg';
		} else if (user.getUsername().length > 12) {
			return 'text-xl';
		} else if (user.getUsername().length > 8) {
			return 'text-2xl';
		}
		return 'text-3xl';
	}

	const handleDebugOptionEnable = () => {
		if (process.env.NEXT_PUBLIC_DEVELOPER_OPTIONS === "true") {
			setShowDebugOptions((showDebugOptions) => showDebugOptions + 1);
		}
	}

	const levelState = useSelector((state: RootState) => state.userLevelSystem[user.getLevelSystem().getLevelSystemId()]);
	let displayLevel = user.getLevel();
	let displayCurrentExp = user.getCurrentExp();
	let displayExpToLevelUp = user.getExpToLevelUp();
	if (levelState) {
		displayLevel = levelState.level;
		displayCurrentExp = levelState.currentExp;
		displayExpToLevelUp = levelState.expToLevelUp;
	}

	return <>
	<div className="flex flex-row items-center justify-center">
		<button onClick={handleDebugOptionEnable}>
			<IconDisplay icon={user.getIcon()} bgColor={`bg-blue-300`} borderColor={`border border-2 border-coffee-700`} textSize={"text-4xl"} elementSize={"12"}/>
		</button>
		<span className={`ml-4 ${getUsernameFontSize()} ${colors.user.usernameTextColor}`}>{user.getUsername()}</span>
	</div>
	<div className="mx-4 my-4"><LevelSystemComponent level={displayLevel} currentExp={displayCurrentExp} expToLevelUp={displayExpToLevelUp} /></div>
	<div className="my-4"><ToolboxComponent toolbox={user.getToolbox()} onToolClickFunction={toggleSelectedItem} maxHeightPercentage={100}/></div>
	<div className="my-4 inline-flex"><DailyLoginRewardClaimButton/></div>
	<div className={`${showDebugOptions >= 3 ? `` : `hidden`}`}>
		<GardenDebugOptions/>
	</div>
	</>
}

export default UserProfileComponent;