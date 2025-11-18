import colors from "@/components/colors/colors";
import RawIconDisplay from "@/components/user/icon/RawIconDisplay";
import Tooltip from "@/components/window/tooltip";
import { Utility } from "./utilityBar";

const UtilityTooltip = ({ children, utility }: { children: React.ReactNode, utility: Utility}) => {

	const RenderTooltipInfo = () => {
		switch(utility.tool?.itemData.type) {
			case "Shovel":
				return RenderShovelTooltip();
			default:
				return RenderEmptyItemTooltip();
		}
	}

	//Can pull this out to a separate file if we ever need multiple formats for tooltips
	const RenderShovelTooltip = () => {
		const currentTool = utility.tool;
    	if (!currentTool) return RenderEmptyItemTooltip(); // safeguard

		return <>
		<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`}>
			<div className="flex flex-row justify-between min-w-max">
				<div className="flex flex-row min-w-0">
				<RawIconDisplay icon={currentTool.itemData.icon} width={6} height={6}/>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentTool.itemData.name}</span>
				</div>
			</div>
			<div className={`${colors.tool.descriptionTextColor} text-left`}>
				{/* {currentTool.description} */}
				{`Destroys plants.`}
			</div>
		</div>
	</>
	}

	const RenderEmptyItemTooltip = () => {
		return <>There was an error!</>;
	}

	const getBackgroundColor = () => {
		return "bg-gray-300";
	}

	return (
		<div>
			<Tooltip content={RenderTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} boxWidth={'20vw'}>
				{children}
			</Tooltip>
		</div>
		);
}

export default UtilityTooltip;