import PlotComponent, { PlotActions, PlotComponentRef } from "@/components/garden/plot";
import { Garden } from "@/models/garden/Garden";
import { Plot } from "@/models/garden/Plot";
import { Inventory } from "@/models/itemStore/inventory/Inventory";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { useRef, useState } from "react";
import { useInventory } from "@/hooks/contexts/InventoryContext";
import { useGarden } from "@/hooks/contexts/GardenContext";
import LevelSystemComponent from "@/components/level/LevelSystem";
import { saveGarden } from "@/utils/localStorage/garden";

const GardenComponent = ({selected, setSelected, inventoryForceRefresh}: {selected: InventoryItem | null, setSelected: Function, inventoryForceRefresh: {value: number, setter: Function}}) => {
	const { inventory } = useInventory();
	const { garden } = useGarden();
	const [gardenForceRefreshKey, setGardenForceRefreshKey] = useState(0);
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
			<div className="flex flex-col flex-wrap max-w-[100%]">
			{plots.map((row, rowIndex) => (
				<div className="flex flex-nowrap" key={rowIndex}>
					{row.map((plot, colIndex) => {
						const index = rowIndex * plots.length + colIndex;
						if (plotRefs.current.length <= rowIndex) {
							//If plotRefs is not big enough, we expand it first.
							//Note that we never shrink plotRefs, but it'll be null and 
							//cleaned up once the user save/loads by switching pages.
							plotRefs.current[rowIndex] = [];
						}
						return (
							<PlotComponent 
								key={index} 
								ref={el => {plotRefs.current[rowIndex][colIndex] = el!}}
								plot={plot} 
								onPlotClick={getPlotAction(plot, selected)} 
								inventoryForceRefresh={inventoryForceRefresh}
							/>
						);
					})}
				</div>
				)
			)}
			</div>
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


	function expandRow() {
		if (!garden) {
			return;
		}
		garden?.addColumn();
		saveGarden(garden);
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}

	function expandCol() {
		if (!garden) {
			return;
		}
		garden?.addRow();
		saveGarden(garden);
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}

	function shrinkRow() {
		if (!garden) {
			return;
		}
		garden?.removeColumn();
		saveGarden(garden);
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}

	function shrinkCol() {
		if (!garden) {
			return;
		}
		garden?.removeRow();
		saveGarden(garden);
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}

	function levelUp() {
		if (!garden) {
			return;
		}
		garden.addExp(garden.getExpToLevelUp());
		saveGarden(garden);
		setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
	}

	return (
		<>
		<div key={gardenForceRefreshKey} className="flex flex-col items-center overflow-x-auto mx-2">
			{generatePlots(garden.getPlots())}
		</div>
		<div className="mx-4 my-4">
			<LevelSystemComponent level={garden.getLevel()} currentExp={garden.getCurrentExp()} expToLevelUp={garden.getExpToLevelUp()}/>
		</div>
		<div>
			<button onClick={plantAll} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>Plant All</button>
			<button onClick={harvestAll} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>Harvest All</button>
		</div>
		<div>
			<button onClick={expandRow} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>expand row</button>
			<button onClick={expandCol} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>expand col</button>
			<button onClick={levelUp} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>levelup</button>
		</div>
		<div>
			<button onClick={shrinkRow} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>shrink row</button>
			<button onClick={shrinkCol} className={`bg-gray-300 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>shrink col</button>
		</div>
     	</>
	);
}

export default GardenComponent;