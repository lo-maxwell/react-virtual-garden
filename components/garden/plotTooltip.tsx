import { Plot } from "@/models/garden/Plot";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import PlaceholderItemTemplates from "@/models/items/templates/PlaceholderItemTemplate";
import { useEffect, useState } from "react";
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

	const RenderPlantTooltip = () => {
		const [currentTime, setCurrentTime] = useState(Date.now());

		// This effect will run once to set up the interval
		useEffect(() => {
			const intervalId = setInterval(() => {
			setCurrentTime(Date.now());
			}, 1000); // Update every second

			// Cleanup function to clear the interval when component unmounts
			return () => clearInterval(intervalId);
		}, []);

		const currentItem = plot.getItem();
		const harvestedItem = PlaceholderItemTemplates.getInventoryTransformTemplate(currentItem.itemData.transformId);
		if (!harvestedItem) return <></>;
		if (currentItem.itemData.name === 'error') {
			return <>
				<div> An error occurred! Please report this to the developers.</div>
			</>
		}

		return <>
			<div className="flex items-center min-w-0 flex-grow">
				<span className="w-6">{currentItem.itemData.icon}</span>
				{/* Might not display properly if screen size is small or name is too long */}
				<span className="flex items-left truncate min-w-0 max-w-[80%]">{currentItem.itemData.name}</span>
			</div>
			<span className="flex min-w-[55px] max-w-[55px]">
				<span className="mr-1">💰</span> {/* Gold icon */}
				{harvestedItem.value}
			</span>
			<div>{plot.getRemainingGrowTime(currentTime)}</div>
		</>
	}

	const RenderDecorationTooltip = () => {
		const currentItem = plot.getItem();
		const blueprint = PlaceholderItemTemplates.getInventoryTransformTemplate(currentItem.itemData.transformId);
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
				<span className="flex items-left truncate min-w-0 max-w-[80%]">{currentItem.itemData.name}</span>
			</div>
		</>
	}

	const RenderEmptyItemTooltip = () => {
		return <></>;
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