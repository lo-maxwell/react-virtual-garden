import colors from "@/components/colors/colors";
import { useDispatch } from "react-redux";
import ToolDisplay from "./toolDisplay";
import ToolTooltip from "./toolTooltip";
import { Tool } from '@/models/items/tools/Tool';

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
			<button onClick={handleClick}>
				<ToolDisplay icon={tool.itemData.icon} bgColor={colors.tool.backgroundColor} borderColor={getBorderColor()} textSize={"text-4xl"} elementSize={"20"}/>
			</button>
		</ToolTooltip>
		</>
	);
}

export default ToolButton;