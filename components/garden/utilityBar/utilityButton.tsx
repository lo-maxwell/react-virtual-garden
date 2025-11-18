import colors from "@/components/colors/colors";
import IconButton from "@/components/user/icon/IconButton";
import React from "react";
import { Utility } from "./utilityBar";
import UtilityTooltip from "./utilityTooltip";


const UtilityButton = ({utility, onClickFunction, focus}: {utility: Utility, onClickFunction: (arg: any) => void, focus: boolean}) => {
	
	const handleClick = () => {
		onClickFunction(utility);
	}

	const getBorderColor = () => {
		if (focus) {
			return colors.inventory.inventoryItemBorderColor;
		} else {
			return `border-white`;
		}
	}

	return (
		<>
		<UtilityTooltip utility={utility}>
			<IconButton icon={utility.icon} onClickFunction={handleClick} bgColor={colors.tool.backgroundColor} borderColor={getBorderColor()} textSize={"text-4xl"} elementSize={"12"}/>
		</UtilityTooltip>
		</>
	);
}

export default UtilityButton;