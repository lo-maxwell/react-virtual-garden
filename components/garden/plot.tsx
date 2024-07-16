import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { forwardRef, useImperativeHandle, useState } from "react";

//contains static onclick functions for plot components
export class PlotActions {
	constructor() {}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem seed into a plant and places it in this plot.
	 * @param inventory - the inventory to get the inventoryItem from
	 * @param item - the inventoryItem to convert to a placedItem
	 * @param plot - the plot to modify
	 * @returns the updated icon
	 */
	static plantSeed(inventory: Inventory, item: InventoryItem, plot: Plot) {
		const helper = () => {
			if (item.itemData.subtype != ItemSubtypes.SEED.name) return plot.getItem().itemData.icon;
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem blueprint into a decoration and places it in this plot.
	 * @param inventory - the inventory to get the inventoryItem from
	 * @param item - the inventoryItem to convert to a placedItem
	 * @param plot - the plot to modify
	 * @returns the updated icon
	 */
	static placeDecoration(inventory: Inventory, item: InventoryItem, plot: Plot) {
		const helper = () => {
			if (item.itemData.subtype != ItemSubtypes.BLUEPRINT.name) return plot.getItem().itemData.icon;
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a plant.
	 * @param inventory - the inventory to modify
	 * @param plot - the plot to modify
	 * @returns the updated icon
	 */
	 static harvestPlant(inventory: Inventory, plot: Plot) {
		const helper = () => {
			if (plot.getItem().itemData.subtype != ItemSubtypes.PLANT.name) return plot.getItem().itemData.icon;
			const pickupItemResponse = plot.pickupItem(inventory);
			if (!pickupItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a decoration.
	 * @param inventory - the inventory to modify
	 * @param plot - the plot to modify
	 * @returns the updated icon
	 */
	 static repackageDecoration(inventory: Inventory, plot: Plot) {
		const helper = () => {
			if (plot.getItem().itemData.subtype != ItemSubtypes.DECORATION.name) return plot.getItem().itemData.icon;
			const pickupItemResponse = plot.pickupItem(inventory);
			if (!pickupItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	static doNothing(plot: Plot) {
		const helper = () => {
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

}

type PlotComponentProps = {
	plot: Plot;
	onPlotClick: () => string;
	inventoryForceRefresh: {value: number, setter: Function};
  };

export interface PlotComponentRef {
	plot: Plot;
	click: () => void;
}

//Need to get global inventory and item to modify with
const PlotComponent = forwardRef<PlotComponentRef, PlotComponentProps>(({plot, onPlotClick, inventoryForceRefresh}, ref) => {
	const [displayIcon, setDisplayIcon] = useState(plot.getItem().itemData.icon);

	useImperativeHandle(ref, () => ({
		click() {
			handleClick();
		},
		plot
	}));

	const handleClick = () => {
		const updatedIcon = onPlotClick();
		if (displayIcon != updatedIcon) {
			setDisplayIcon(updatedIcon);
			inventoryForceRefresh.setter(inventoryForceRefresh.value + 1);
		}
	}

	return (
		<button onClick={handleClick} className="bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">{displayIcon}</button>
	  );
});

export default PlotComponent;