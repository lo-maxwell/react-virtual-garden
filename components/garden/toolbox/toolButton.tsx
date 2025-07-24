import colors from "@/components/colors/colors";
import { useDispatch } from "react-redux";
import ToolDisplay from "./toolDisplay";
import ToolTooltip from "./toolTooltip";
import { Tool } from '@/models/items/tools/Tool';
import IconButton from "@/components/user/icon/IconButton";

const ToolButton = ({tool, onClickFunction, focus}: {tool: Tool, onClickFunction: (arg: any) => void, focus: boolean}) => {
	
	const handleClick = () => {
		onClickFunction(tool);
	}

	const getTextColor = () => {
		//itemStore instanceof Inventory
		return colors.inventory.inventoryDefaultItemTextColor;
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
		<ToolTooltip tool={tool}>
			<IconButton icon={tool.itemData.icon} onClickFunction={handleClick} bgColor={colors.tool.backgroundColor} borderColor={getBorderColor()} textSize={"text-4xl"} elementSize={"20"}/>
		</ToolTooltip>
		</>
	);
}

export default ToolButton;