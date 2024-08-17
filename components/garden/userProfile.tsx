import { useUser } from "@/hooks/contexts/UserContext";
import { iconRepository } from "@/models/user/icons/IconRepository";
import { useRef, useState, useEffect } from "react";
import colors from "../colors/colors";
import LevelSystemComponent from "../level/LevelSystem";
import IconDisplay from "../user/icon/IconDisplay";

const UserProfileComponent = () => {
	const { user } = useUser();

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

	return <>
	<div className="flex flex-row items-center justify-center">
		<IconDisplay icon={user.getIcon()} size={"text-4xl"}/>
		<span className={`ml-4 ${getUsernameFontSize()} ${colors.user.usernameTextColor}`}>{user.getUsername()}</span>
	</div>
	<div className="mx-4 my-4"><LevelSystemComponent level={user.getLevel()} currentExp={user.getCurrentExp()} expToLevelUp={user.getExpToLevelUp()} /></div>
	</>
}

export default UserProfileComponent;