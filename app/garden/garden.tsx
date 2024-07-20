import PlotComponent, { PlotActions, PlotComponentRef } from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { saveGarden } from "@/utils/localStorage/garden";
import { saveInventory } from "@/utils/localStorage/inventory";
import { useRef } from "react";

const GardenComponent = ({garden, inventory, selected, setSelected, inventoryForceRefresh}: {garden: Garden, inventory: Inventory, selected: InventoryItem | null, setSelected: Function, inventoryForceRefresh: {value: number, setter: Function}}) => {
	const plotRefs = useRef<PlotComponentRef[][]>(garden.getPlots().map(row => row.map(() => null!)));

	function getPlotAction(plot: Plot, selected: InventoryItem | null) {
		if (plot.getItemSubtype() == ItemSubtypes.GROUND.name && selected != null) {
			if (selected.itemData.subtype == ItemSubtypes.SEED.name) {
				return PlotActions.plantSeed(inventory, selected, plot, garden);
			} else if (selected.itemData.subtype == ItemSubtypes.BLUEPRINT.name) {
				return PlotActions.placeDecoration(inventory, selected, plot, garden);
			}
		}
		if (plot.getItemSubtype() == ItemSubtypes.PLANT.name) {
			return PlotActions.harvestPlant(inventory, plot, garden);
		}
		if (plot.getItemSubtype() == ItemSubtypes.DECORATION.name) {
			return PlotActions.repackageDecoration(inventory, plot, garden);
		}
		return PlotActions.doNothing(plot);
	}
	

	function generatePlots(plots: Plot[][]) {
		return (
			<>
			{plots.map((row, rowIndex) => (
				<div className="flex overflow-hidden" key={rowIndex}>
					{row.map((plot, colIndex) => {
						const index = rowIndex * plots.length + colIndex;
						return (
							<PlotComponent 
								key={index} 
								ref={el => plotRefs.current[rowIndex][colIndex] = el!}
								plot={plot} 
								onPlotClick={getPlotAction(plot, selected)} 
								inventoryForceRefresh={inventoryForceRefresh}
							/>
						);
					})}
				</div>
			))}
			</>
		);
	}

	function plantAll() {
		if (selected == null || selected.itemData.subtype != ItemSubtypes.SEED.name) return;
		const getItemResponse = inventory.getItem(selected);
		if (!getItemResponse.isSuccessful()) return;
		let numRemaining = getItemResponse.payload.getQuantity();

		for (const row of plotRefs.current) {
			for (const plotRef of row) {
				if (plotRef && plotRef.plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
					plotRef.click();
					numRemaining--;
					if (numRemaining <= 0) {
						return;
					}
				}
			}
		}
	}

	function harvestAll() {
		plotRefs.current.forEach(row => {
			row.forEach(plotRef => {
			  if (plotRef && plotRef.plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
				plotRef.click();
			  }
			});
		  });
	}

	return (
		<>
		{generatePlots(garden.getPlots())}
		<div>
			<button onClick={plantAll} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>Plant All</button>
		</div>
		<div>
			<button onClick={harvestAll} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>Harvest All</button>
		</div>
     	</>
	);
}

export default GardenComponent;