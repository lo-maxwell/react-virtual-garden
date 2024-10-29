import { Plot } from "@/models/garden/Plot";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { Plant } from "@/models/items/placedItems/Plant";
import PlotTooltip from "./plotTooltip";
import colors from "../colors/colors";
import { useAccount } from "@/app/hooks/contexts/AccountContext";

type PlotComponentProps = {
	plot: Plot;
	onPlotClickHelpers: {uiHelper: () => {success: boolean, displayIcon: string}, apiHelper: () => Promise<{success: boolean, displayIcon: string}>}
	currentTime: number;
  };

export interface PlotComponentRef {
	plot: Plot;
	click: () => void;
	currentTime: number;
	refresh: () => void;
}

const PlotComponent = forwardRef<PlotComponentRef, PlotComponentProps>(({plot, onPlotClickHelpers, currentTime}, ref) => {
	PlotComponent.displayName = "Plot";
	const [displayIcon, setDisplayIcon] = useState(plot.getItem().itemData.icon);
	const [forceRefreshKey, setForceRefreshKey] = useState(0);
	const { account, cloudSave } = useAccount();

	const getColor = () => {
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
			return `border ${colors.ground.plotBackgroundColor} ${colors.ground.defaultBorderColor}`;
		} else if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			const plant = plot.getItem() as Plant;
			const timeElapsed = Date.now() - plot.getPlantTime();
			const growTime = plot.getTotalGrowTime();
			// const growTime = plant.itemData.growTime;
			if (growTime * 1000 <= timeElapsed) {
				return `bg-apple-500 border ${colors.plant.grownBorderColor}`;
			} else if (growTime * 3/4 * 1000 <= timeElapsed) {
				return `bg-apple-400 border ${colors.plant.defaultBorderColor}`;
			} else if (growTime/2 * 1000 <= timeElapsed) {
				return `bg-apple-300 border ${colors.plant.defaultBorderColor}`;
			} else if (growTime * 1/4 * 1000 <= timeElapsed) {
				return `bg-apple-200 border ${colors.plant.defaultBorderColor}`;
			} else {
				return `bg-apple-100 border ${colors.plant.defaultBorderColor}`;
			}

		} else if (plot.getItemSubtype() === ItemSubtypes.DECORATION.name) {
			return `border ${colors.decoration.plotBackgroundColor} ${colors.decoration.defaultBorderColor}`;
		} else {
			//should never occur
			return `bg-gray-300 border ${colors.plant.defaultBorderColor}`;
		}
	}

	const [color, setColor] = useState(() => getColor());

	useImperativeHandle(ref, () => ({
		click() {
			handleClick();
		},
		plot,
		currentTime,
		refresh() {
			// This method can be called to refresh the component
			setForceRefreshKey((prevKey) => prevKey + 1); // Increment the key to force a re-render
			setDisplayIcon(plot.getItem().itemData.icon);
		}
	}));

	const currentItem = plot.getItem();
	const currentPlantTime = plot.getPlantTime();

	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;
		setColor(getColor());
  
		if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
		  interval = setInterval(() => {
			setColor(getColor());
		  }, 1000);
		}
  
		return () => {
		  if (interval) {
			clearInterval(interval);
		  }
		};
	  }, [currentItem, currentPlantTime, plot]);

	const handleClick = async () => {
		//onPlotClick comes from plotActions which may/may not be async
		const uiResult = onPlotClickHelpers.uiHelper();
		if (uiResult.success) {
			setDisplayIcon(uiResult.displayIcon);
		} else {
			//no changes, don't need to do anything here (?)
			return;
		}
		
		// Terminate early before api call
		if (!cloudSave) {
			return;
		}

		const apiResult = await onPlotClickHelpers.apiHelper();
		if (apiResult.success) {
			setDisplayIcon(apiResult.displayIcon);
		} else {
			console.warn(`Api call failed`);
			setDisplayIcon(apiResult.displayIcon);
			setForceRefreshKey((forceRefreshKey) => forceRefreshKey + 1); //we force a refresh to clear statuses
		}
	}


	return (
		<PlotTooltip plot={plot} currentTime={currentTime} key={forceRefreshKey}>
			<button onClick={handleClick} className={`flex items-center justify-center text-4xl ${color} w-12 h-12 text-purple-600 font-semibold hover:text-white hover:bg-purple-600 hover:border-transparent`} data-testid="plot">{displayIcon}</button>
		</PlotTooltip>
	);
});

export default PlotComponent;
