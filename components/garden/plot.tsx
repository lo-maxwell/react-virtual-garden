import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { useState } from "react";

//contains static onclick functions for plot components
export class PlotActions {
	constructor() {}

	

}

export default function PlotComponent ({text, onPlotClick}: {text: String, onPlotClick: () => any}) {
	const [displayIcon, setDisplayIcon] = useState(text);


	return (
		<button onClick={onPlotClick} className="bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2">{displayIcon}</button>
	  );
}