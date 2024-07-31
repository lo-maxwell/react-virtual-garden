import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { saveGarden } from "@/utils/localStorage/garden";
import { saveInventory } from "@/utils/localStorage/inventory";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useGarden } from "@/hooks/contexts/GardenContext";

//contains static onclick functions for plot components
export class PlotActions {
	constructor() {}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem seed into a plant and places it in this plot.
	 * @param inventory - the inventory to get the inventoryItem from
	 * @param item - the inventoryItem to convert to a placedItem
	 * @param plot - the plot to modify
	 * @param garden - the garden that the plot belongs to, only used for saving
	 * @returns the updated icon
	 */
	static plantSeed(inventory: Inventory, item: InventoryItem, plot: Plot, garden: Garden) {
		const helper = () => {

			if (item.itemData.subtype != ItemSubtypes.SEED.name) return plot.getItem().itemData.icon;
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			saveInventory(inventory);
			saveGarden(garden);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem blueprint into a decoration and places it in this plot.
	 * @param inventory - the inventory to get the inventoryItem from
	 * @param item - the inventoryItem to convert to a placedItem
	 * @param plot - the plot to modify
	 * @param garden - the garden that the plot belongs to, only used for saving
	 * @returns the updated icon
	 */
	static placeDecoration(inventory: Inventory, item: InventoryItem, plot: Plot, garden: Garden) {
		const helper = () => {
			if (item.itemData.subtype != ItemSubtypes.BLUEPRINT.name) return plot.getItem().itemData.icon;
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			saveInventory(inventory);
			saveGarden(garden);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a plant.
	 * @param inventory - the inventory to modify
	 * @param plot - the plot to modify
	 * @param garden - the garden that the plot belongs to, only used for saving
	 * @returns the updated icon
	 */
	 static harvestPlant(inventory: Inventory, plot: Plot, garden: Garden) {
		const helper = () => {
			if (plot.getItem().itemData.subtype != ItemSubtypes.PLANT.name) return plot.getItem().itemData.icon;
			const xp = plot.getExpValue();
			const pickupItemResponse = plot.pickupItem(inventory);
			if (!pickupItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			garden.addExp(xp);
			saveInventory(inventory);
			saveGarden(garden);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a decoration.
	 * @param inventory - the inventory to modify
	 * @param plot - the plot to modify
	 * @param garden - the garden that the plot belongs to, only used for saving
	 * @returns the updated icon
	 */
	 static repackageDecoration(inventory: Inventory, plot: Plot, garden: Garden) {
		const helper = () => {
			if (plot.getItem().itemData.subtype != ItemSubtypes.DECORATION.name) return plot.getItem().itemData.icon;
			const pickupItemResponse = plot.pickupItem(inventory);
			if (!pickupItemResponse.isSuccessful()) return plot.getItem().itemData.icon; //unnecessary?
			saveInventory(inventory);
			saveGarden(garden);
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

const PlotComponent = forwardRef<PlotComponentRef, PlotComponentProps>(({plot, onPlotClick, inventoryForceRefresh}, ref) => {
	PlotComponent.displayName = "Plot";
	const { garden } = useGarden();
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

	function getColor() {
		if (plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
			return `bg-gray-300`;
		} else if (plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
			return `bg-green-300`;
		} else if (plot.getItemSubtype() === ItemSubtypes.DECORATION.name) {
			return `bg-gray-100`;
		} else {
			//should never occur
			return `bg-gray-300`;
		}
	}

	return (
		<button onClick={handleClick} className={`flex items-center justify-center text-4xl ${getColor()} w-12 h-12 text-purple-600 font-semibold border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent`}>{displayIcon}</button>
	  );
});

export default PlotComponent;