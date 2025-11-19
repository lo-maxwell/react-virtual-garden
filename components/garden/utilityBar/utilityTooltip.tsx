import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import colors from "@/components/colors/colors";
import RawIconDisplay from "@/components/user/icon/RawIconDisplay";
import Tooltip from "@/components/window/tooltip";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import ToolTemplate from "@/models/items/templates/models/ToolTemplates/ToolTemplate";
import { Utility } from "./utilityBar";

const UtilityTooltip = ({ children, utility }: { children: React.ReactNode, utility: Utility }) => {

	const { selectedItem } = useSelectedItem();

	const RenderTooltipInfo = () => {
		switch (utility.icon) {
			case "shovel":
				return RenderShovelTooltip();
			case "plantAll":
				return RenderPlantAllTooltip();
			case "harvestAll":
				return RenderHarvestAllTooltip();
			case "pickupAll":
				return RenderPickupAllTooltip();
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
					<div className="flex flex-row min-w-0 text-xl">
						<RawIconDisplay icon={currentTool.itemData.icon} width={6} height={6} />
						{/* Might not display properly if screen size is small or name is too long */}
						<span>{currentTool.itemData.name}</span>
					</div>
				</div>
				<div className={`${colors.tool.descriptionTextColor} text-left`}>
					{/* {currentTool.description} */}
					{`Select a plant to destroy it, freeing up the plot for a new seedling.`}
				</div>
			</div>
		</>
	}

	const RenderPlantAllTooltip = () => {
		if (!selectedItem || selectedItem.itemData instanceof ToolTemplate || selectedItem.itemData.subtype !== ItemSubtypes.SEED.name) {
			return <>
				<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`}>
					<div className="flex flex-row justify-between min-w-max">
						<div className="flex flex-row min-w-0 text-xl">
							<RawIconDisplay icon={utility.icon} width={6} height={6} />
							<span>{`Plant All`}</span>
						</div>
					</div>
					<div className={`${colors.tool.descriptionTextColor} text-left`}>
						{`Select a seed in your inventory to plant as many as possible of it.`}
					</div>
				</div>
			</>
		}
		return <>
			<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`}>
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row min-w-0 text-xl">
						<RawIconDisplay icon={selectedItem?.itemData.icon} width={6} height={6} />
						<span>{`Plant All ${selectedItem.itemData.name}`}</span>
					</div>
				</div>
				<div className={`${colors.tool.descriptionTextColor} text-left`}>
					{/* {currentTool.description} */}
					{`Plants as many ${selectedItem.itemData.name}s as possible.`}
				</div>
			</div>
		</>
	}

	const RenderHarvestAllTooltip = () => {
		return <>
			<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`}>
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row min-w-0 text-xl">
						<RawIconDisplay icon={utility.icon} width={6} height={6} />
						<span>{`Harvest All Plants`}</span>
					</div>
				</div>
				<div className={`${colors.tool.descriptionTextColor} text-left`}>
					{/* {currentTool.description} */}
					{`Harvests all ripe plants in the garden.`}
				</div>
			</div>
		</>
	}

	const RenderPickupAllTooltip = () => {
		return <>
			<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`}>
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row min-w-0 text-xl">
						<RawIconDisplay icon={utility.icon} width={6} height={6} />
						<span>{`Pick Up All Decorations`}</span>
					</div>
				</div>
				<div className={`${colors.tool.descriptionTextColor} text-left`}>
					{`Removes all currently placed decorations, returning them to your inventory.`}
				</div>
			</div>
		</>
	}

	const RenderEmptyItemTooltip = () => {
		return <>There was an error! Please report this to the developers!</>;
	}

	const getBackgroundColor = () => {
		return "bg-blue-300";
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