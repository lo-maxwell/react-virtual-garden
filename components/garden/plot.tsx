import { Plot } from "@/models/garden/Plot";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useGarden } from "@/hooks/contexts/GardenContext";
import { Plant } from "@/models/items/placedItems/Plant";

type PlotComponentProps = {
	plot: Plot;
	onPlotClick: () => string;
	inventoryForceRefresh: {value: number, setter: Function};
  };

export interface PlotComponentRef {
	plot: Plot;
	click: () => void;
}

const PlotComponent = forwardRef<PlotComponentRef, PlotComponentProps>(({plot, onPlotClick, inventoryForceRefresh}, ref) => {
	PlotComponent.displayName = "Plot";
	const { garden } = useGarden();
	const [displayIcon, setDisplayIcon] = useState(plot.getItem().itemData.icon);
	const [color, setColor] = useState(() => getColor());

	useImperativeHandle(ref, () => ({
		click() {
			handleClick();
		},
		plot
	}));

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
	  }, [plot.getItem(), plot.getPlantTime()]);

	const handleClick = () => {
		const updatedIcon = onPlotClick();
		if (displayIcon != updatedIcon) {
			setDisplayIcon(updatedIcon);
			inventoryForceRefresh.setter(inventoryForceRefresh.value + 1);
		}
	}

	function getColor() {
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
			return `bg-gray-300 border border-purple-200`;
		} else if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			const plant = plot.getItem() as Plant;
			const timeElapsed = Date.now() - plot.getPlantTime();
			if (plant.itemData.growTime * 1000 <= timeElapsed) {
				return `bg-green-500 border border-yellow-500`;
			} else if (plant.itemData.growTime * 3/4 * 1000 <= timeElapsed) {
				return `bg-green-400 border border-purple-200`;
			} else if (plant.itemData.growTime/2 * 1000 <= timeElapsed) {
				return `bg-green-300 border border-purple-200`;
			} else if (plant.itemData.growTime * 1/4 * 1000 <= timeElapsed) {
				return `bg-green-200 border border-purple-200`;
			} else {
				return `bg-green-100 border border-purple-200`;
			}

		} else if (plot.getItemSubtype() === ItemSubtypes.DECORATION.name) {
			return `bg-gray-100 border border-purple-200`;
		} else {
			//should never occur
			return `bg-gray-300 border border-purple-200`;
		}
	}

	return (
		<button onClick={handleClick} className={`flex items-center justify-center text-4xl ${color} w-12 h-12 text-purple-600 font-semibold hover:text-white hover:bg-purple-600 hover:border-transparent`}>{displayIcon}</button>
	  );
});

export default PlotComponent;