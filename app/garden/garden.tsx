import PlotComponent, { PlotActions, PlotComponentRef } from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { useRef } from "react";

const GardenComponent = ({garden, inventory, selected, setSelected, inventoryForceRefresh}: {garden: Garden, inventory: Inventory, selected: InventoryItem, setSelected: Function, inventoryForceRefresh: {value: number, setter: Function}}) => {
	const plotRefs = useRef<PlotComponentRef[][]>(garden.getPlots().map(row => row.map(() => null!)));
	
	function getPlotAction(plot: Plot, selected: InventoryItem) {
		if (plot.getItemSubtype() == ItemSubtypes.GROUND.name && selected != null) {
			if (selected.itemData.subtype == ItemSubtypes.SEED.name) {
				return PlotActions.plantSeed(inventory, selected, plot);
			} else if (selected.itemData.subtype == ItemSubtypes.BLUEPRINT.name) {
				return PlotActions.placeDecoration(inventory, selected, plot);
			}
		}
		if (plot.getItemSubtype() == ItemSubtypes.PLANT.name) {
			return PlotActions.harvestPlant(inventory, plot);
		}
		if (plot.getItemSubtype() == ItemSubtypes.DECORATION.name) {
			return PlotActions.repackageDecoration(inventory, plot);
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
		setSelected(null);
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
			<button onClick={plantAll}>Plant All</button>
		</div>
		<div>
			<button onClick={harvestAll}>Harvest All</button>
		</div>
     	</>
	);
}

export default GardenComponent;