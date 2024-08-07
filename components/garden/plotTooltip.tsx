import { Plot } from "@/models/garden/Plot";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { Plant } from "@/models/items/placedItems/Plant";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import React, { useEffect, useState } from "react";
import colors from "../colors/colors";
import Tooltip from "../textbox/tooltip";

const PlotTooltip = ({ children, plot }: { children: React.ReactNode, plot: Plot}) => {

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
		const [currentTime, setCurrentTime] = useState(Date.now());
		const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

		// This effect will run once to set up the interval
		useEffect(() => {
			const id = setInterval(() => {
				// Update currentTime
				setCurrentTime(Date.now());
			}, 1000); // Update every second
	
			setIntervalId(id);
	
			return () => clearInterval(id); // Cleanup function to clear the interval on unmount
		}, []); // Empty dependency array ensures this effect runs only once
	

		useEffect(() => {
			// Run this effect whenever currentTime updates
			if (plot.getRemainingGrowTime(currentTime) === "Ready to harvest!") {
				// Stop the interval
				if (intervalId) {
					clearInterval(intervalId);
				}
			}
		}, [currentTime, intervalId]); // Dependency array includes currentTime and intervalId
	

		const currentItem = plot.getItem() as Plant;
		const harvestedItem = placeholderItemTemplates.getInventoryTemplate(currentItem.itemData.transformId);
		if (!harvestedItem) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return (<>
			<div className="flex flex-col items-left min-w-0 flex-grow">
				<div className="flex flex-row justify-between flex-grow min-w-max">
					<div className="flex flex-row min-w-0">
						<span className="w-6">{currentItem.itemData.icon}</span>
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
			</div>
		</>);
	}

	const RenderDecorationTooltip = () => {
		const currentItem = plot.getItem();
		const blueprint = placeholderItemTemplates.getInventoryTemplate(currentItem.itemData.transformId);
		if (!blueprint) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return  <>
		<div className="flex flex-col items-left min-w-0 flex-grow">
			<div className="flex flex-row justify-between flex-grow min-w-max">
				<div className="flex flex-row min-w-0">
					<span className="w-6">{currentItem.itemData.icon}</span>
					{/* Might not display properly if screen size is small or name is too long */}
					<span>{currentItem.itemData.name}</span>
				</div>
				<span className="ml-2 flex ">
						<span className="">💰</span> {/* Gold icon */}
						{blueprint.value}
					</span>
			</div>
			<div className={`${colors.decoration.categoryTextColor} text-left`}>Decoration</div>
		</div>
	</>
	}

	const RenderEmptyItemTooltip = () => {
		const currentItem = plot.getItem();
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return  <>
		<div className="flex flex-col items-left min-w-0 flex-grow">
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
			default:
				return colors.ground.plotTooltipBackground;
		}
	}

	const showTooltip = plot.getItemSubtype() === ItemSubtypes.GROUND.name ? 'OFF' : '';

	return (
		<Tooltip content={RenderPlotTooltipInfo()} position="top" backgroundColor={getBackgroundColor()} forceVisible={showTooltip} boxWidth={'20vw'}>
			{children}
		</Tooltip>);
}

export default PlotTooltip;