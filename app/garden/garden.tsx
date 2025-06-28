import PlotComponent, { PlotComponentRef } from "@/components/garden/plot";
import { Plot } from "@/models/garden/Plot";
import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import React, { useEffect, useRef, useState } from "react";
import { useInventory } from "@/app/hooks/contexts/InventoryContext";
import { useGarden } from "@/app/hooks/contexts/GardenContext";
import { saveGarden } from "@/utils/localStorage/garden";
import { usePlotActions } from "@/app/hooks/garden/plotActions";
import { useSelectedItem } from "@/app/hooks/contexts/SelectedItemContext";
import { useUser } from "@/app/hooks/contexts/UserContext";
import GardenExpansionTooltip from "./gardenExpansionTooltip";
import { Garden } from "@/models/garden/Garden";
import { addColumnAPI, addColumnLocal, addRowAPI, addRowLocal, harvestAllAPI, pickupAllAPI, plantAllAPI, removeColumnAPI, removeColumnLocal, removeRowAPI, removeRowLocal, syncGardenSize, syncUserGardenInventory } from "./gardenFunctions";
import { useAccount } from "../hooks/contexts/AccountContext";
import { useDispatch } from "react-redux";
import { setAllLevelSystemValues } from "@/store/slices/userLevelSystemSlice";
import { ToolTypes } from "@/models/itemStore/toolbox/tool/ToolTypes";
import { Tool } from "@/models/items/tools/Tool";

const GardenComponent = () => {
	const { inventory, reloadInventory } = useInventory();
	const { garden, gardenMessage, setGardenMessage, instantGrow, toggleInstantGrow, reloadGarden } = useGarden();
	const { user, reloadUser } = useUser();
	const {selectedItem, toggleSelectedItem} = useSelectedItem();
	const [gardenForceRefreshKey, setGardenForceRefreshKey] = useState(0);
	const plotRefs = useRef<PlotComponentRef[][]>(garden.getPlots().map(row => row.map(() => null!)));
	const [showExpansionOptions, setShowExpansionOptions] = useState(false);
	const {plantSeed, placeDecoration, clickPlant, clickDecoration, destroyItem, doNothing} = usePlotActions();
	const { account, guestMode } = useAccount();
	const dispatch = useDispatch();

	const [currentTime, setCurrentTime] = useState(Date.now());
	// const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
	useEffect(() => {
		const id = setInterval(() => {
			// Update currentTime
			setCurrentTime(Date.now());
		}, 1000); // Update every second
		// setIntervalId(id);
		return () => clearInterval(id); // Cleanup function to clear the interval on unmount
	}, []);

	const GetPlotAction = (plot: Plot, selected: InventoryItem | Tool | null) => {
		//TODO: Fix this
		if (plot.getItemSubtype() == ItemSubtypes.GROUND.name && selected instanceof InventoryItem) {
			if (selected.itemData.subtype == ItemSubtypes.SEED.name) {
				return plantSeed(selected, plot);
			} else if (selected.itemData.subtype == ItemSubtypes.BLUEPRINT.name) {
				return placeDecoration(selected, plot);
			}
		}
		if (selected instanceof Tool) {
			if (selected.itemData.type == ToolTypes.SHOVEL.name && (plot.getItemSubtype() == ItemSubtypes.PLANT.name)) {
				return destroyItem(plot, selected);
			} else {
				// console.warn(`Tool of type ${selected.itemData.type} not yet implemented!`);
				return doNothing(plot, `This tool doesn't have any effect here.`);
			}
		}
		if (plot.getItemSubtype() == ItemSubtypes.PLANT.name) {
			return clickPlant(plot, instantGrow);
		}
		if (plot.getItemSubtype() == ItemSubtypes.DECORATION.name) {
			return clickDecoration(plot);
		}
		return doNothing(plot);
	}

	const generatePlots = (plots: Plot[][]) => {
		return (
			<>
			<div className="flex flex-col flex-wrap max-w-[100%]" data-testid="garden-plots">
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
								onPlotClickHelpers={GetPlotAction(plot, selectedItem)} 
								currentTime={currentTime}
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

	const plantAll = async ()  => {
		if (selectedItem == null || selectedItem instanceof Tool || selectedItem.itemData.subtype != ItemSubtypes.SEED.name) return;
		const getItemResponse = inventory.getItem(selectedItem);
		if (!getItemResponse.isSuccessful()) return;
		let numRemaining = getItemResponse.payload.getQuantity();

		const plantedPlotIds = [];
		let numPlanted = 0;
		for (const row of plotRefs.current) {
			for (const plotRef of row) {
				if (numRemaining <= 0) break;
				if (plotRef && plotRef.plot.getItemSubtype() === ItemSubtypes.GROUND.name) {
					const plantSeedAction = plantSeed(selectedItem, plotRef.plot).uiHelper;
					// Performs local update
					const plantSeedResult = plantSeedAction();
					if (plantSeedResult.success) {
						numPlanted++;
						numRemaining--;
						plantedPlotIds.push(plotRef.plot.getPlotId());
						plotRef.refresh();
					}
				}
			}
		}

		//Did not plant, terminate early
		if (plantedPlotIds.length <= 0 && numPlanted <= 0) {
			return;
		}
		
		// Terminate early before api call
		if (!guestMode) {
			//api call
			setGardenMessage(`Planted ${numPlanted} ${getItemResponse.payload.itemData.name}.`);
			const apiResult = await plantAllAPI(plantedPlotIds, inventory, selectedItem, user, garden);
			if (!apiResult) {
				await syncUserGardenInventory(user, garden, inventory);
				reloadUser();
				reloadGarden();
				reloadInventory();
				setGardenMessage(`There was an error planting 1 or more seeds! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
				// return;
			}
		}
		dispatch(setAllLevelSystemValues({ id: user.getLevelSystem().getLevelSystemId(), level: user.getLevelSystem().getLevel(), currentExp: user.getLevelSystem().getCurrentExp(), expToLevelUp: user.getLevelSystem().getExpToLevelUp() }));
	}

	const harvestAll = async () => {
		const harvestedPlotIds: string[] = [];
		let numHarvested = 0;

		plotRefs.current.forEach(row => {
			row.forEach(plotRef => {
			  if (plotRef && plotRef.plot.getItemSubtype() === ItemSubtypes.PLANT.name) {
				const harvestPlantAction = clickPlant(plotRef.plot, instantGrow).uiHelper;
					// Performs local update
					const harvestPlantResult = harvestPlantAction();
					if (harvestPlantResult.success) {
						numHarvested++;
						harvestedPlotIds.push(plotRef.plot.getPlotId());
						plotRef.refresh();
					}
			  }
			});
		  });

		setGardenMessage(`Harvested ${numHarvested} plants.`);

		//Did not plant, terminate early
		if (harvestedPlotIds.length <= 0 && numHarvested <= 0) {
			return;
		}

		// Terminate early before api call
		if (!guestMode) {
			//api call
			const apiResult = await harvestAllAPI(harvestedPlotIds, inventory, user, garden, instantGrow);
			if (!apiResult) {
				await syncUserGardenInventory(user, garden, inventory);
				reloadUser();
				reloadGarden();
				reloadInventory();
				setGardenMessage(`There was an error harvesting 1 or more plants! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
				
			}
		}
		dispatch(setAllLevelSystemValues({ id: user.getLevelSystem().getLevelSystemId(), level: user.getLevelSystem().getLevel(), currentExp: user.getLevelSystem().getCurrentExp(), expToLevelUp: user.getLevelSystem().getExpToLevelUp() }));

	}

	const pickupAll = async () => {
		const pickupPlotIds: string[] = [];
		let numDecorations = 0;

		plotRefs.current.forEach(row => {
			row.forEach(plotRef => {
			  if (plotRef && plotRef.plot.getItemSubtype() === ItemSubtypes.DECORATION.name) {
				const pickupDecorationAction = clickDecoration(plotRef.plot).uiHelper;
					// Performs local update
					const harvestPlantResult = pickupDecorationAction();
					if (harvestPlantResult.success) {
						numDecorations++;
						pickupPlotIds.push(plotRef.plot.getPlotId());
						plotRef.refresh();
					}
			  }
			});
		  });

		setGardenMessage(`Picked up ${numDecorations} decorations.`);

		if (pickupPlotIds.length <= 0 || numDecorations <= 0) {
			return;
		}

		// Terminate early before api call
		if (!guestMode) {
			//api call
			const apiResult = await pickupAllAPI(pickupPlotIds, inventory, user, garden);
			if (!apiResult) {
				await syncUserGardenInventory(user, garden, inventory);
				reloadUser();
				reloadGarden();
				reloadInventory();
				setGardenMessage(`There was an error picking up 1 or more decorations! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
			}
		}

	}


	async function addColumn() {
		if (!garden || !user) {
			return;
		}
		const localResult = addColumnLocal(garden, user);
		if (localResult) {
			setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
			
			// Terminate early before api call
			if (guestMode) {
				return;
			}

			const apiResult = await addColumnAPI(garden, user);
			if (!apiResult) {
				syncGardenSize(garden, user);
				// setGardenMessage(`There was an error expanding the garden, please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// removeColumnLocal(garden);
			}
		}
		dispatch(setAllLevelSystemValues({ id: user.getLevelSystem().getLevelSystemId(), level: user.getLevelSystem().getLevel(), currentExp: user.getLevelSystem().getCurrentExp(), expToLevelUp: user.getLevelSystem().getExpToLevelUp() }));

	}

	async function addRow() {
		if (!garden || !user) {
			return;
		}
		const localResult = addRowLocal(garden, user);
		if (localResult) {
			setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);

			// Terminate early before api call
			if (guestMode) {
				return;
			}
			
			const apiResult = await addRowAPI(garden, user);
			if (!apiResult) {
				syncGardenSize(garden, user);
				// setGardenMessage(`There was an error expanding the garden, please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// removeRowLocal(garden);
			}
		}
	}

	async function removeColumn() {
		if (!garden) {
			return;
		}
		const localResult = removeColumnLocal(garden);
		if (localResult) {
			setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
			
			// Terminate early before api call
			if (guestMode) {
				return;
			}
		
			const apiResult = await removeColumnAPI(garden, user);
			if (!apiResult) {
				syncGardenSize(garden, user);
				// setGardenMessage(`There was an error shrinking the garden, please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// addColumnLocal(garden, user);
			}
		}
	}

	async function removeRow() {
		if (!garden) {
			return;
		}
		const localResult = removeRowLocal(garden);
		if (localResult) {
			setGardenForceRefreshKey((gardenForceRefreshKey) => gardenForceRefreshKey + 1);
		
			// Terminate early before api call
			if (guestMode) {
				return;
			}

			const apiResult = await removeRowAPI(garden, user);
			if (!apiResult) {
				syncGardenSize(garden, user);
				// setGardenMessage(`There was an error shrinking the garden, please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				// addRowLocal(garden, user);
			}
		}
	}

	function handleGardenExpansionDisplay() {
		setShowExpansionOptions((showExpansionOptions) => !showExpansionOptions);
	}

	const enableGardenExpansionButton = (row: boolean, expand: boolean) => {
		if (row && expand) {
			return !Garden.canAddRow(garden.getRows(), user.getLevel());
		} else if (!row && expand) {
			return !Garden.canAddColumn(garden.getCols(), user.getLevel());
		} else if (row && !expand) { 
			return garden.getRows() < 2;
		} else { //(!row && !expand)
			return garden.getCols() < 2;
		} 
	}

	return (
		<>
		<div className="min-h-8">{gardenMessage}</div>
		<div key={gardenForceRefreshKey} className=" px-2 py-2 flex flex-col items-center mx-2">
			<div className="overflow-x-auto max-w-full py-1">
				{generatePlots(garden.getPlots())}
			</div>
		</div>
		<div className="my-1">
			<div>
				<button onClick={plantAll} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="plant-all">Plant All</button>
				<button onClick={harvestAll} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="harvest-all">Harvest All</button>
				<button onClick={pickupAll} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="harvest-all">Remove Decorations</button>
			</div>
			<button onClick={handleGardenExpansionDisplay} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`}>{`${!showExpansionOptions ? `Show` : `Hide`} Garden Expansion Options`}</button>
			<div className={`${showExpansionOptions ? `` : `hidden`} flex flex-row`}>
				<div className="flex flex-col">
					<GardenExpansionTooltip row={true} expand={false}>
						<button onClick={removeRow} disabled={enableGardenExpansionButton(true, false)} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="shrink-col">Remove Garden Row</button>
					</GardenExpansionTooltip>
					<GardenExpansionTooltip row={false} expand={false}>
						<button onClick={removeColumn} disabled={enableGardenExpansionButton(false, false)} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="shrink-row">Remove Garden Column</button>
					</GardenExpansionTooltip>
				</div>
				<div className="flex flex-col">
					<GardenExpansionTooltip row={true} expand={true}>
						<button onClick={addRow} disabled={enableGardenExpansionButton(true, true)} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="expand-col">Add Garden Row</button>
					</GardenExpansionTooltip>
					<GardenExpansionTooltip row={false} expand={true}>
						<button onClick={addColumn} disabled={enableGardenExpansionButton(false, true)} className={`bg-gray-300 px-4 py-1 mx-1 my-1 text-sm text-purple-600 font-semibold rounded-full border border-purple-200 hover:text-white hover:bg-purple-600 hover:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2`} data-testid="expand-row">Add Garden Column</button>
					</GardenExpansionTooltip>
				</div>
			</div>
		</div>
     	</>
	);
}

export default GardenComponent;