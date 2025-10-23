import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { Plot } from "@/models/garden/Plot";
import { Blueprint } from "@/models/items/inventoryItems/Blueprint";
import { Seed } from "@/models/items/inventoryItems/Seed";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { Plant } from "@/models/items/placedItems/Plant";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { PlantTemplate } from "@/models/items/templates/models/PlacedItemTemplates/PlantTemplate";
import React, { useEffect, useState } from "react";
import colors from "../colors/colors";
import Tooltip, { ForceVisibleMode } from "../window/tooltip";
import { HarvestedItemTemplate } from "@/models/items/templates/models/InventoryItemTemplates/HarvestedItemTemplate";
import { Tool } from "@/models/items/tools/Tool";
import RawIconDisplay from "../user/icon/RawIconDisplay";

const PlotTooltip = ({ children, plot, currentTime }: { children: React.ReactNode, plot: Plot, currentTime: number}) => {

	const {selectedItem} = useSelectedItem();

	const RenderPlotTooltipInfo = () => {
		const currentItem = plot.getItem();
		switch(currentItem.itemData.subtype) {
			case ItemSubtypes.GROUND.name:
				return RenderEmptyItemTooltip();
			case ItemSubtypes.DECORATION.name:
				return RenderDecorationTooltip();
			case ItemSubtypes.PLANT.name:
				return RenderPlantTooltip();
			default:
				return RenderEmptyItemTooltip();
		}
	}

	//Can pull this out to a separate file if we ever need multiple formats for tooltips
	const RenderPlantTooltip = () => {
		const currentItem = plot.getItem() as Plant;
		const harvestedItem = itemTemplateFactory.getInventoryTemplateById(currentItem.itemData.transformId);
		if (!harvestedItem) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return (<>
			<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`} data-testid="tool-tip">
				<div className="flex flex-row justify-between flex-grow min-w-max">
					<div className="flex flex-row min-w-0">
					<RawIconDisplay icon={currentItem.itemData.icon} width={6} height={6}/>
						{/* Might not display properly if screen size is small or name is too long */}
						<span>{currentItem.itemData.name}</span>
					</div>
					<span className="ml-2 flex ">
						<span className="">💰</span> {/* Gold icon */}
						{harvestedItem.value}
					</span>
				</div>
				<div className={`${colors.harvested.categoryTextColor} text-left`}>Plant</div>
				<div className={`${colors.harvested.categoryTextColor} text-left`}>Category: {currentItem.itemData.category}</div>
				<div>{plot.getRemainingGrowTime(currentTime)}</div>
				<div>XP Gained: {currentItem.itemData.baseExp}</div>
				<div>Harvests Remaining: {plot.getUsesRemaining()}</div>
			</div>
		</>);
	}

	const RenderDecorationTooltip = () => {
		const currentItem = plot.getItem();
		const blueprint = itemTemplateFactory.getInventoryTemplateById(currentItem.itemData.transformId);
		if (!blueprint) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return  <>
		<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`} >
			<div className="flex flex-row justify-between flex-grow min-w-max">
				<div className="flex flex-row min-w-0">
					<RawIconDisplay icon={currentItem.itemData.icon} width={6} height={6}/>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentItem.itemData.name}</span>
				</div>
				{/* <span className="ml-2 flex ">
						<span className="">💰</span>
						{blueprint.value}
					</span> */}
			</div>
			<div className={`${colors.decoration.categoryTextColor} text-left`}>Decoration</div>
		</div>
	</>
	}

	const RenderEmptyItemTooltipWithSeedSelected = () => {
		const emptyItem = plot.getItem();
		if (emptyItem.itemData.name === 'error' || !selectedItem) {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}
		const currentItem = selectedItem as Seed;
		const plantedItem = itemTemplateFactory.getPlacedTemplateById(currentItem.itemData.transformId);
		if (!plantedItem || plantedItem.subtype !== ItemSubtypes.PLANT.name) return <></>;
		const plantTemplate = plantedItem as PlantTemplate;
		const harvestedItem = itemTemplateFactory.getInventoryTemplateById(plantedItem.transformId);
		if (!harvestedItem|| harvestedItem.subtype !== ItemSubtypes.HARVESTED.name) return <></>;
		const harvestedTemplate = harvestedItem as HarvestedItemTemplate;

		return <>
		<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`} >
			<div className="flex flex-row justify-between min-w-max">
				<div className="flex flex-row min-w-0">
					<RawIconDisplay icon={currentItem.itemData.icon} width={6} height={6}/>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentItem.itemData.name}</span>
				</div>
				<span className="ml-2 flex ">
					<span className="">💰</span> {/* Gold icon */}
					{currentItem.itemData.value}
				</span>
			</div>
			<div className={`${colors.blueprint.categoryTextColor} text-left`}>Seed</div>
			<div className={`${colors.harvested.categoryTextColor} text-left`}>Category: {currentItem.itemData.category}</div>
			<div>When planted: </div>
			<div className="flex flex-row justify-between">
				<div className="flex flex-row">
					<RawIconDisplay icon={plantedItem.icon} width={6} height={6}/>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{plantedItem.name}</span>
				</div>
				<span className="ml-2 flex ">
					<span className="">💰</span> {/* Gold icon */}
					{harvestedItem.value}
				</span>
			</div>
			<div>{plantTemplate.numHarvests === 1 ? `1 harvest` : plantTemplate.numHarvests.toString() + ' harvests'}</div>
			<div>{plantTemplate.getGrowTimeString()}</div>
			<div>XP Gained: {plantTemplate.baseExp}</div>
		</div>
	</>
	}

	const RenderEmptyItemTooltipWithBlueprintSelected = () => {
		const emptyItem = plot.getItem();
		if (emptyItem.itemData.name === 'error' || !selectedItem) {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}
		const currentItem = selectedItem as Blueprint;
		const decoration = itemTemplateFactory.getPlacedTemplateById(currentItem.itemData.transformId);
		if (!decoration) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
			<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`} >
				<div>Placing: </div>
				<div className="flex flex-row justify-between min-w-max">
					<div className="flex flex-row">
						<RawIconDisplay icon={currentItem.itemData.icon} width={6} height={6}/>
						{/* Might not display properly if screen size is small or name is too long */}
						<span>{currentItem.itemData.name}</span>
					</div>
					{/* Removed gold icon for clutter */}
					{/* 
						<span className="ml-2 flex ">
							<span className="">💰</span> 
							{currentItem.itemData.value}
						</span>
					*/}
				</div>
				<div className={`${colors.blueprint.categoryTextColor} text-left`}>Blueprint</div>
				<div>When placed: </div>
				<div className="flex flex-row">
					<RawIconDisplay icon={decoration.icon} width={6} height={6}/>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{decoration.name}</span>
				</div>
			</div>
		</>
	}

	const RenderEmptyItemTooltip = () => {
		const currentItem = plot.getItem();
		if (currentItem.itemData.name === 'error' || !selectedItem || selectedItem instanceof Tool) {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}
		if (selectedItem.itemData.subtype === ItemSubtypes.SEED.name) {
			return RenderEmptyItemTooltipWithSeedSelected();
		}
		if (selectedItem.itemData.subtype === ItemSubtypes.BLUEPRINT.name) {
			return RenderEmptyItemTooltipWithBlueprintSelected();
		}

		return  <>
		<div className={`flex flex-col items-left min-w-0 flex-grow ${colors.inventory.inventoryDefaultItemTextColor}`} >
			<div className="flex flex-row justify-between flex-grow min-w-max">
				<div>
					<span>Empty Plot</span>
				</div>
			</div>
		</div>
	</>
	}

	const getBackgroundColor = () => {
		const currentItem = plot.getItem();
		switch(currentItem.itemData.subtype) {
			case ItemSubtypes.DECORATION.name:
				return colors.decoration.plotTooltipBackground;
			case ItemSubtypes.PLANT.name:
				return colors.plant.plotTooltipBackground;
			case ItemSubtypes.GROUND.name:
				if (selectedItem && !(selectedItem instanceof Tool) && selectedItem.itemData.subtype === ItemSubtypes.SEED.name) {
					return colors.plant.plotTooltipBackground;
				} else if (selectedItem && !(selectedItem instanceof Tool) && selectedItem.itemData.subtype === ItemSubtypes.BLUEPRINT.name) {
					return colors.decoration.plotTooltipBackground;
				} else {
					return colors.ground.plotTooltipBackground;
				}
			default:
				return colors.ground.plotTooltipBackground;
		}
	}

	// const showTooltip = plot.getItemSubtype() === ItemSubtypes.GROUND.name ? 'OFF' : '';

	const shouldShowTooltip: () => ForceVisibleMode = () => {
		if (plot.getItemSubtype() === ItemSubtypes.DECORATION.name || plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			return 'DEFAULT';
		}
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name && selectedItem && !(selectedItem instanceof Tool) && (selectedItem.itemData.subtype === ItemSubtypes.SEED.name)) {
			return 'DEFAULT';
		}
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name && selectedItem && !(selectedItem instanceof Tool) && (selectedItem.itemData.subtype === ItemSubtypes.BLUEPRINT.name)) {
			return 'DEFAULT';
		}

		return 'OFF';
	}

	return (
		<Tooltip content={RenderPlotTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={shouldShowTooltip()} boxWidth={'20vw'}>
			{children}
		</Tooltip>);
}

export default PlotTooltip;