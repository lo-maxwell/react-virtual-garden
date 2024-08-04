import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import colors from "../colors/colors";
import plot from "../garden/plot";
import Tooltip from "../textbox/tooltip";

const InventoryItemTooltip = ({ children, item }: { children: React.ReactNode, item: InventoryItem}) => {

	const RenderItemTooltipInfo = () => {
		switch(item.itemData.subtype) {
			case ItemSubtypes.SEED.name:
				return RenderSeedTooltip();
			case ItemSubtypes.HARVESTED.name:
				return RenderHarvestedTooltip();
			case ItemSubtypes.BLUEPRINT.name:
				return RenderBlueprintTooltip();
			default:
				return RenderEmptyItemTooltip();
		}
	}

	const RenderSeedTooltip = () => {
		const currentItem = item as Seed;
		const plantedItem = PlaceholderItemTemplates.getPlacedTransformTemplate(currentItem.itemData.transformId);
		if (!plantedItem) return <></>;
		const harvestedItem = PlaceholderItemTemplates.getInventoryTransformTemplate(plantedItem.transformId);
		if (!harvestedItem) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
			<div className="flex items-center min-w-max flex-grow">
				<span className="w-6">{currentItem.itemData.icon}</span>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left min-w-0">{plantedItem.name}</span>
			</div>
			<span className="flex min-w-[55px] max-w-[55px]">
				<span className="mr-1">💰</span> {/* Gold icon */}
				{harvestedItem.value}
			</span>
		</>
	}

	const RenderHarvestedTooltip = () => {
		const currentItem = item as HarvestedItem;

		return <>
			<div className="flex items-center min-w-0 flex-grow">
				<span className="w-6">{currentItem.itemData.icon}</span>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left min-w-0 ">{currentItem.itemData.name}</span>
			</div>
			<span className="flex min-w-[55px] max-w-[55px]">
				<span className="mr-1">💰</span> {/* Gold icon */}
				{currentItem.itemData.value}
			</span>
		</>
	}

	const RenderBlueprintTooltip = () => {
		const currentItem = item as Blueprint;
		const blueprint = PlaceholderItemTemplates.getPlacedTransformTemplate(currentItem.itemData.transformId);
		if (!blueprint) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
			<div className="flex items-center min-w-0 flex-grow">
				<span className="w-6">{currentItem.itemData.icon}</span>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left min-w-0">{currentItem.itemData.name}</span>
			</div>
		</>
	}

	const RenderEmptyItemTooltip = () => {
		return <>hello world</>;
	}

	const getBackgroundColor = () => {
		switch(item.itemData.subtype) {
			case ItemSubtypes.SEED.name:
				return colors.seed.inventoryTooltipBackground;
			case ItemSubtypes.HARVESTED.name:
				return colors.harvested.inventoryTooltipBackground;
			case ItemSubtypes.BLUEPRINT.name:
				return colors.blueprint.inventoryTooltipBackground;
			default:
				return "bg-gray-300";
		}
	}

	// const showTooltip = plot.getItemSubtype() === ItemSubtypes.GROUND.name ? 'OFF' : 'ON';

	return (
		<div className="w-full">
			<Tooltip content={RenderItemTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={""} boxWidth={"40vw"}>
				{children}
			</Tooltip>
		</div>
		);
}

export default InventoryItemTooltip;