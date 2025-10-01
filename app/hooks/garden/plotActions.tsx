import { Plot } from "@/models/garden/Plot";
import { InventoryItem, InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem, PlacedItemEntity } from "@/models/items/placedItems/PlacedItem";
import { itemTemplateFactory } from "@/models/items/templates/models/ItemTemplateFactory";
import { loadGarden, saveGarden } from "@/utils/localStorage/garden";
import { loadInventory, saveInventory } from "@/utils/localStorage/inventory";
import { loadUser, saveUser } from "@/utils/localStorage/user";
import { useGarden } from "../contexts/GardenContext";
import { useInventory } from "../contexts/InventoryContext";
import { useSelectedItem } from "../contexts/SelectedItemContext";
import { useUser } from "../contexts/UserContext";
import { useDispatch } from "react-redux";
import { makeApiRequest } from "@/utils/api/api";
import { setItemQuantity } from "@/store/slices/inventoryItemSlice";
import { HarvestedItem } from "@/models/items/inventoryItems/HarvestedItem";
import { Tool } from "@/models/items/tools/Tool";
import { syncAllAccountObjects } from "../../garden/gardenFunctions";

export enum PlotActionType {
    PLANT_SEED = 'plantSeed',
    PLACE_DECORATION = 'placeDecoration', 
    CLICK_PLANT = 'clickPlant',
    CLICK_DECORATION = 'clickDecoration',
    DESTROY_ITEM = 'destroyItem',
    DO_NOTHING = 'doNothing'
}

//contains static onclick functions for plot components
export const usePlotActions = () => {
	const {garden, setGardenMessage, reloadGarden } = useGarden();
	const {inventory, reloadInventory} = useInventory();
	const {user, reloadUser} = useUser();
	const {toggleSelectedItem} = useSelectedItem();
	const dispatch = useDispatch();

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem seed into a plant and places it in this plot.
	 * @item the inventoryItem to convert to a placedItem
	 * @plot the plot to modify
	 * @returns the updated icon
	 */
	const plantSeed = (item: InventoryItem, plot: Plot) => {
		let originalIcon: string;
		const uiHelper = () => {
			originalIcon = plot.getItem().itemData.icon;
			// Optimistically update the local state
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) {
				setGardenMessage(` `);
				return {success: false, displayIcon: originalIcon};
			}
			// updateInventoryForceRefreshKey();
			if (item.getQuantity() <= 0) {
				toggleSelectedItem(null);
			}
			
			// Update redux store
			dispatch(setItemQuantity({ 
				inventoryItemId: item.getInventoryItemId(), 
				quantity: item.getQuantity()
			}));

			saveInventory(inventory);
			saveGarden(garden);
			setGardenMessage(`Planted ${item.itemData.name}.`);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}

		const apiHelper = async () => {
			const data = {
				inventoryId: inventory.getInventoryId(), 
				inventoryItemIdentifier: item.itemData.id
			};

			try {
				const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/plant`;
				const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);
                if (!apiResponse.success) {
                    throw new Error(apiResponse.error?.message || "Failed to plant seed");
                }
                const result: PlacedItemEntity = apiResponse.data as PlacedItemEntity;
				console.log('Successfully planted seed:', result);
				return {success: true, displayIcon: plot.getItem().itemData.icon};
			} catch (error) {
				console.error(error);
				// Rollback the optimistic update
				await syncAllAccountObjects(user, garden, inventory);
				console.warn(`There was an error planting a seed, synced garden state to the cloud`);
				reloadGarden();
				reloadInventory();
				reloadUser();
				setGardenMessage(`There was an error! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				return {success: false, displayIcon: originalIcon};
			}
		}

		const toReturn = {
			uiHelper: uiHelper,
			apiHelper: apiHelper,
			actionType: PlotActionType.PLANT_SEED,
		}
		return toReturn;
	}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem blueprint into a decoration and places it in this plot.
	 * @item - the inventoryItem to convert to a placedItem
	 * @plot - the plot to modify
	 * @returns the updated icon
	 */
	const placeDecoration = (item: InventoryItem, plot: Plot) => {
		let originalIcon: string;
		const uiHelper = () => {
			originalIcon = plot.getItem().itemData.icon;
			// Optimistically update the local state
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) {
				setGardenMessage(` `);
				return {success: false, displayIcon: originalIcon};
			}
			
			// Update redux store
			dispatch(setItemQuantity({ 
				inventoryItemId: item.getInventoryItemId(), 
				quantity: item.getQuantity()
			}));

			saveInventory(inventory);
			saveGarden(garden);
			setGardenMessage(`Placed ${item.itemData.name}.`);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}

		const apiHelper = async () => {
			const originalItem = plot.getItem();

			const data = {
				inventoryId: inventory.getInventoryId(), 
				inventoryItemIdentifier: item.itemData.id
			};

			try {
				const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/place`;
				const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);
                if (!apiResponse.success) {
                    throw new Error(apiResponse.error?.message || "Failed to place decoration");
                }
                const result: PlacedItemEntity = apiResponse.data as PlacedItemEntity;
				console.log('Successfully placed decoration:', result);
				return {success: true, displayIcon: plot.getItem().itemData.icon};
			} catch (error) {
				console.error(error);
				// Rollback the optimistic update
				await syncAllAccountObjects(user, garden, inventory);
				console.warn(`There was an error placing a decoration, synced garden state to the cloud`);
				reloadGarden();
				reloadInventory();
				reloadUser();
				setGardenMessage(`There was an error! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				return {success: false, displayIcon: originalIcon};
			}
		}
		
		const toReturn = {
			uiHelper: uiHelper,
			apiHelper: apiHelper,
			actionType: PlotActionType.PLACE_DECORATION,
		}
		return toReturn;
	}

	/**
	 * Can only be used in a plot with a plant. Removes the plant and adds a harvestedItem to inventory.
	 * @plot the plot to modify
	 * @instantGrow if set to true, ignores grow timers and instantly harvests
	 * @returns the updated icon
	 */
	const clickPlant = (plot: Plot, instantGrow: boolean = false) => {
		let originalIcon: string;
		const uiHelper = () => {
			originalIcon = plot.getItem().itemData.icon;
			// Optimistically update the local state
			// const originalItem = plot.getItem();
			const canHarvest = Plot.canHarvest(plot.getItem().itemData, plot.getPlantTime(), plot.getUsesRemaining(), Date.now());
			if (!(canHarvest || instantGrow)) {
				setGardenMessage(` `);
				return {success: false, displayIcon: originalIcon, payload: null};
			}
			const xp = plot.getExpValue();
			const harvestItemResponse = plot.harvestItem(inventory, instantGrow, 1);
			const harvestedItem = harvestItemResponse.payload.newItem as HarvestedItem;
			const historyResult = user.updateHarvestHistory(harvestedItem, 1);
			if (!historyResult.isSuccessful()) console.warn(historyResult);
			user.addExp(xp);			
			
			// Update redux store
			dispatch(setItemQuantity({ 
				inventoryItemId: harvestItemResponse.payload.newItem.getInventoryItemId(), 
				quantity: harvestItemResponse.payload.newItem.getQuantity()
			}));

			saveInventory(inventory);
			saveGarden(garden);
			saveUser(user);
			setGardenMessage(`Harvested ${harvestItemResponse.payload.pickedItem.itemData.name}.`);
			return {success: true, displayIcon: plot.getItem().itemData.icon, payload: harvestItemResponse.payload.newItem};
		}

		const apiHelper = async () => {
			const data = {
				inventoryId: inventory.getInventoryId(), 
				levelSystemId: user.getLevelSystem().getLevelSystemId(), 
				numHarvests: 1, // Usually only 1 harvest
				replacementItem: null, // Replace with ground as default
				instantHarvestKey: instantGrow ? 'mangomangobear' : '' // Works in dev environment only
			}
			try {
				const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/harvest`;
				const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);

                if (!apiResponse.success) {
                    throw new Error(apiResponse.error?.message || "Failed to harvest item");
                }
                const result: InventoryItemEntity = apiResponse.data as InventoryItemEntity;

				const itemTemplate = itemTemplateFactory.getInventoryTemplateById(result.identifier);
				if (!itemTemplate) {
					console.error(itemTemplate);
					throw new Error(`Error parsing item template`);
				}
				const inventoryItem = inventory.getItem(itemTemplate);
				if (!(inventoryItem.isSuccessful())) {
					throw new Error(`Error finding item in inventory: ${itemTemplate.id}`);
				}
				(inventoryItem.payload as InventoryItem).setInventoryItemId(result.id);
				console.log('Successfully harvested:', result);
				return {success: true, displayIcon: plot.getItem().itemData.icon};
			} catch (error) {
				console.error(error);
				// Rollback the optimistic update
				await syncAllAccountObjects(user, garden, inventory);
				console.warn(`There was an error clicking a plant, synced garden state to the cloud`);
				reloadGarden();
				reloadInventory();
				reloadUser();
				setGardenMessage(`There was an error! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				return {success: false, displayIcon: originalIcon};
			}
		}
		
		const toReturn = {
			uiHelper: uiHelper,
			apiHelper: apiHelper,
			actionType: PlotActionType.CLICK_PLANT,
		}
		return toReturn;
	}

	/**
	 * Can only be used in a plot with a decoration. Removes the decoration and adds a blueprint to inventory.
	 * @plot the plot to modify
	 * @returns the updated icon
	 */
	const clickDecoration = (plot: Plot) => {
		let originalIcon: string;
		const uiHelper = () => {
			originalIcon = plot.getItem().itemData.icon;
			// Optimistically update the local state
			// const originalItem = plot.getItem();
			if (plot.getItem().itemData.subtype != ItemSubtypes.DECORATION.name) {
				setGardenMessage(` `);
				return {success: false, displayIcon: originalIcon};
			}
			const pickupItemResponse = plot.pickupItem(inventory);
			//decorations no longer affect history
			// const pickedItem = pickupItemResponse.payload.pickedItem as PlacedItem;
			// const historyResult = user.updateDecorationHistory(pickedItem, 1);
			// if (!historyResult.isSuccessful()) console.warn(historyResult);
			
			// Update redux store
			dispatch(setItemQuantity({ 
				inventoryItemId: pickupItemResponse.payload.newItem.getInventoryItemId(), 
				quantity: pickupItemResponse.payload.newItem.getQuantity()
			}));
			
			saveInventory(inventory);
			saveGarden(garden);
			saveUser(user);
			setGardenMessage(`Picked up ${pickupItemResponse.payload.pickedItem.itemData.name}.`);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}

		const apiHelper = async () => {
			const data = {
				inventoryId: inventory.getInventoryId(), 
				replacementItem: null, // Replace with ground as default
			}
			try {
				const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/pickup`;
				const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);
				
                if (!apiResponse.success) {
                    throw new Error(apiResponse.error?.message || "Failed to pick up item");
                }
                const result: InventoryItemEntity = apiResponse.data as InventoryItemEntity;

				const itemTemplate = itemTemplateFactory.getInventoryTemplateById(result.identifier);
				if (!itemTemplate) {
					throw new Error(`Error parsing item template`);
				}
				const inventoryItem = inventory.getItem(itemTemplate);
				if (!(inventoryItem.isSuccessful())) {
					throw new Error(`Error finding item in inventory`)
				}
				(inventoryItem.payload as InventoryItem).setInventoryItemId(result.id);
				console.log('Successfully picked up decoration:', result);
				return {success: true, displayIcon: plot.getItem().itemData.icon};
			} catch (error) {
				console.error(error);
				// Rollback the optimistic update
				await syncAllAccountObjects(user, garden, inventory);
				console.warn(`There was an error clicking a decoration, synced garden state to the cloud`);
				reloadGarden();
				reloadInventory();
				reloadUser();
				setGardenMessage(`There was an error! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
				return {success: false, displayIcon: originalIcon};
			}
		}
		
		const toReturn = {
			uiHelper: uiHelper,
			apiHelper: apiHelper,
			actionType: PlotActionType.CLICK_DECORATION,
		}
		return toReturn;
	}

	/**
	 * Can only be used in a plot with a decoration or plant. Destroys the item in the plot, giving nothing back to the player.
	 * @plot the plot to modify
	 * @tool the tool being used (currently does nothing)
	 * @returns the updated icon
	 */
	const destroyItem = (plot: Plot, tool: Tool) => {
		let originalIcon: string;
		const uiHelper = () => {
			originalIcon = plot.getItem().itemData.icon;
			// Optimistically update the local state
			// const originalItem = plot.getItem();
			if (!(plot.getItemSubtype() == ItemSubtypes.DECORATION.name || plot.getItemSubtype() == ItemSubtypes.PLANT.name)) {
				setGardenMessage(` `);
				return {success: false, displayIcon: originalIcon};
			}
			const destroyItemResponse = plot.destroyItem();
			if (!destroyItemResponse.isSuccessful()) {
				setGardenMessage(`There was an error destroying the item.`);
				return {success: false, displayIcon: originalIcon};
			}
			
			saveInventory(inventory);
			saveGarden(garden);
			saveUser(user);
			setGardenMessage(`Destroyed ${destroyItemResponse.payload.originalItem.itemData.name}.`);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}

		const apiHelper = async () => {
			const data = {
				toolId: tool.itemData.id,
				replacementItem: null, // Replace with ground as default
			}
			try {
				const apiRoute = `/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/destroy`;
				const apiResponse = await makeApiRequest('PATCH', apiRoute, data, true);
					
                    if (!apiResponse.success) {
                        throw new Error(apiResponse.error?.message || "Failed to destroy item");
                    }
                    const result: PlacedItemEntity = apiResponse.data as PlacedItemEntity;
					
					const itemTemplate = itemTemplateFactory.getPlacedTemplateById(result.identifier);
					if (!itemTemplate) {
						throw new Error(`Error parsing item template`);
					}
					console.log('Successfully destroyed item.');
					return {success: true, displayIcon: plot.getItem().itemData.icon};
				} catch (error) {
					console.error(error);
					// Rollback the optimistic update
					await syncAllAccountObjects(user, garden, inventory);
					console.warn(`There was an error destroying an item, synced garden state to the cloud`);
					reloadGarden();
					reloadInventory();
					reloadUser();
					setGardenMessage(`There was an error! Please refresh the page! If the error persists, force an account refresh under profile -> settings -> force sync account.`);
					return {success: false, displayIcon: originalIcon};
				}
			}
			
			const toReturn = {
				uiHelper: uiHelper,
				apiHelper: apiHelper,
				actionType: PlotActionType.DESTROY_ITEM,
			}
			return toReturn;
		}

	const doNothing = (plot: Plot, newMessage: string = '') => {
		const uiHelper = () => {
			setGardenMessage(newMessage);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}

		const apiHelper = async () => {
			setGardenMessage(newMessage);
			return {success: true, displayIcon: plot.getItem().itemData.icon};
		}
		
		const toReturn = {
			uiHelper: uiHelper,
			apiHelper: apiHelper,
			actionType: PlotActionType.DO_NOTHING,
		}
		return toReturn;
	}

	return {
		plantSeed,
		placeDecoration,
		clickPlant,
		clickDecoration,
		destroyItem,
		doNothing
	}

}
