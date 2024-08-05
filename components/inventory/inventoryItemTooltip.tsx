import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { Plant } from "@/models/items/placedItems/Plant";
import { HarvestedItemTemplate } from "@/models/items/templates/HarvestedItemTemplate";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import { PlantTemplate } from "@/models/items/templates/PlantTemplate";
import { useRef, useState, useEffect } from "react";
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
		if (!plantedItem || plantedItem.subtype !== ItemSubtypes.PLANT.name) return <></>;
		const plantTemplate = plantedItem as PlantTemplate;
		const harvestedItem = PlaceholderItemTemplates.getInventoryTransformTemplate(plantedItem.transformId);
		if (!harvestedItem|| harvestedItem.subtype !== ItemSubtypes.HARVESTED.name) return <></>;
		const harvestedTemplate = harvestedItem as HarvestedItemTemplate;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
		<div className="flex flex-col items-left min-w-0 flex-grow">
			<div className="flex flex-row justify-between min-w-max">
				<div className="flex flex-row min-w-0">
					<span className="w-6 flex-shrink-0">{currentItem.itemData.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentItem.itemData.name}</span>
				</div>
				<span className="ml-2 flex ">
					<span className="">💰</span> {/* Gold icon */}
					{currentItem.itemData.value}
				</span>
			</div>
			<div className={`${colors.blueprint.categoryTextColor} text-left`}>Seed</div>
			<div>When planted: </div>
			<div className="flex flex-row justify-between">
				<div className="flex flex-row">
					<span className="w-6">{plantedItem.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{plantedItem.name}</span>
				</div>
				<span className="ml-2 flex ">
					<span className="">💰</span> {/* Gold icon */}
					{harvestedItem.value}
				</span>
			</div>
			<div>Grow time: {plantTemplate.growTime} seconds</div>
		</div>
	</>
	}

	const RenderHarvestedTooltip = () => {
		const currentItem = item as HarvestedItem;

		return <>
		<div className="flex flex-col items-left min-w-0 flex-grow">
			<div className="flex flex-row justify-between flex-grow min-w-max">
				<div className="flex flex-row">
					<span className="w-6">{currentItem.itemData.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentItem.itemData.name}</span>
				</div>
				<span className="ml-2 flex ">
					<span className="">💰</span> {/* Gold icon */}
					{currentItem.itemData.value}
				</span>
			</div>
			<div className={`${colors.harvested.categoryTextColor} text-left`}>Harvested</div>
		</div>
	</>
	}

	const RenderBlueprintTooltip = () => {
		const currentItem = item as Blueprint;
		const decoration = PlaceholderItemTemplates.getPlacedTransformTemplate(currentItem.itemData.transformId);
		if (!decoration) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
			<div className="flex flex-col items-left min-w-0 flex-grow">
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row">
						<span className="w-6">{currentItem.itemData.icon}</span>
						{/* Might not display properly if screen size is small or name is too long */}
						<span>{currentItem.itemData.name}</span>
					</div>
					<span className="ml-2 flex ">
						<span className="">💰</span> {/* Gold icon */}
						{currentItem.itemData.value}
					</span>
				</div>
				<div className={`${colors.blueprint.categoryTextColor} text-left`}>Blueprint</div>
				<div>When placed: </div>
				<div className="flex flex-row">
					<span className="w-6">{decoration.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{decoration.name}</span>
				</div>
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
			<Tooltip content={RenderItemTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={""} boxWidth={"300px"}>
				{children}
			</Tooltip>
		</div>
		);
}

export default InventoryItemTooltip;