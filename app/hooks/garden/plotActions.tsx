import { Plot } from "@/models/garden/Plot";
import { InventoryItem, InventoryItemEntity } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtypes } from "@/models/items/ItemTypes";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { placeholderItemTemplates } from "@/models/items/templates/models/PlaceholderItemTemplate";
import { saveGarden } from "@/utils/localStorage/garden";
import { saveInventory } from "@/utils/localStorage/inventory";
import { saveUser } from "@/utils/localStorage/user";
import { useGarden } from "../contexts/GardenContext";
import { useInventory } from "../contexts/InventoryContext";
import { useSelectedItem } from "../contexts/SelectedItemContext";
import { useUser } from "../contexts/UserContext";

//contains static onclick functions for plot components
export const usePlotActions = () => {
	const {garden, setGardenMessage } = useGarden();
	const {inventory, updateInventoryForceRefreshKey} = useInventory();
	const {user} = useUser();
	const {toggleSelectedItem} = useSelectedItem();

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem seed into a plant and places it in this plot.
	 * @item the inventoryItem to convert to a placedItem
	 * @plot the plot to modify
	 * @returns the updated icon
	 */
	const plantSeed = (item: InventoryItem, plot: Plot) => {
		const helper = async () => {

			if (item.itemData.subtype != ItemSubtypes.SEED.name) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			}
			try {
				const data = {
					inventoryId: inventory.getInventoryId(), 
					inventoryItemId: item.getInventoryItemId()
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/plant`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to plant seed');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully planted seed:', result);
			  } catch (error) {
				console.error(error);
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			  } finally {
			  }
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon; 
			}
			updateInventoryForceRefreshKey();
			if (item.getQuantity() <= 0) {
				toggleSelectedItem(null);
			}
			saveInventory(inventory);
			saveGarden(garden);
			setGardenMessage(`Planted ${item.itemData.name}.`);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in an empty plot. Converts an inventoryItem blueprint into a decoration and places it in this plot.
	 * @item - the inventoryItem to convert to a placedItem
	 * @plot - the plot to modify
	 * @returns the updated icon
	 */
	const placeDecoration = (item: InventoryItem, plot: Plot) => {
		const helper = async () => {
			if (item.itemData.subtype != ItemSubtypes.BLUEPRINT.name) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			}
			try {
				const data = {
					inventoryId: inventory.getInventoryId(), 
					inventoryItemId: item.getInventoryItemId()
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/place`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to place decoration');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully placed decoration:', result);
			  } catch (error) {
				console.error(error);
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			  } finally {
			  }
			const placeItemResponse = plot.placeItem(inventory, item);
			if (!placeItemResponse.isSuccessful()) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon; 
			}
			updateInventoryForceRefreshKey();

			const placedItem = placeItemResponse.payload.newItem as PlacedItem;
			user.updateDecorationHistory(placedItem);
			if (item.getQuantity() <= 0) {
				toggleSelectedItem(null);
			}
			saveInventory(inventory);
			saveGarden(garden);
			saveUser(user);
			setGardenMessage(`Placed ${placeItemResponse.payload.newItem.itemData.name}.`);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a plant. Removes the plant and adds a harvestedItem to inventory.
	 * @plot the plot to modify
	 * @instantGrow if set to true, ignores grow timers and instantly harvests
	 * @returns the updated icon
	 */
	const clickPlant = (plot: Plot, instantGrow: boolean = false) => {
		const helper = async () => {
			const canHarvest = Plot.canHarvest(plot.getItem().itemData, plot.getPlantTime(), plot.getUsesRemaining(), Date.now());
			if (!(canHarvest || instantGrow)) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			}
			try {
				const data = {
					inventoryId: inventory.getInventoryId(), 
					levelSystemId: user.getLevelSystem().getLevelSystemId(), 
					numHarvests: 1, //Usually only 1 harvest
					replacementItem: null, //Replace with ground as default
					instantHarvestKey: instantGrow ? 'mangomangobear' : '' //Works in dev environment only
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/harvest`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to harvest plant');
				}
		  
				// Parsing the response data
				const result: InventoryItemEntity = await response.json();
				console.log('Successfully harvested:', result);

				const xp = plot.getExpValue();
				const harvestItemResponse = plot.harvestItem(inventory, instantGrow, 1);
				if (!harvestItemResponse.isSuccessful()) {
					setGardenMessage(` `);
					return plot.getItem().itemData.icon;
				} 
				const itemTemplate = placeholderItemTemplates.getInventoryTemplate(result.identifier);
				if (!itemTemplate) {
					setGardenMessage(`There was an error parsing the item id, please contact the developer`);
					return plot.getItem().itemData.icon;
				}
				const inventoryItem = inventory.getItem(itemTemplate);
				if (!(inventoryItem.isSuccessful())) {
					setGardenMessage(`There was an error parsing the item, please contact the developer`);
					return plot.getItem().itemData.icon;
				}
				//TODO: Fix this
				//Hack to ensure consistency between database and model item ids
				//After we update the database, it returns an id, which we assign to the newly
				//added inventoryItem
				(inventoryItem.payload as InventoryItem).setInventoryItemId(result.id);
				updateInventoryForceRefreshKey();

				const pickedItem = harvestItemResponse.payload.pickedItem as PlacedItem;
				user.updateHarvestHistory(pickedItem);
				user.addExp(xp);
				saveInventory(inventory);
				saveGarden(garden);
				saveUser(user);
				setGardenMessage(`Harvested ${harvestItemResponse.payload.pickedItem.itemData.name}.`);
				return plot.getItem().itemData.icon;
			  } catch (error) {
				console.error(error);
				//TODO: reload user to fix display issue with xp
				// const reloadedUser = loadUser() as User;
				// saveUser(reloadedUser);
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			  } finally {
			  }
			
		}
		return helper;
	}

	/**
	 * Can only be used in a plot with a decoration. Removes the decoration and adds a blueprint to inventory.
	 * @plot the plot to modify
	 * @returns the updated icon
	 */
	const clickDecoration = (plot: Plot) => {
		const helper = async () => {
			if (plot.getItem().itemData.subtype != ItemSubtypes.DECORATION.name) {
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			}
			try {
				const data = {
					inventoryId: inventory.getInventoryId(), 
					replacementItem: null, //Replace with ground as default
				}
				// Making the PATCH request to your API endpoint
				const response = await fetch(`/api/user/${user.getUserId()}/garden/${garden.getGardenId()}/plot/${plot.getPlotId()}/pickup`, {
				  method: 'PATCH',
				  headers: {
					'Content-Type': 'application/json',
				  },
				  body: JSON.stringify(data), // Send the data in the request body
				});
		  
				// Check if the response is successful
				if (!response.ok) {
				  throw new Error('Failed to pickup decoration');
				}
		  
				// Parsing the response data
				const result = await response.json();
				console.log('Successfully picked up decoration:', result);
				const pickupItemResponse = plot.pickupItem(inventory);
				if (!pickupItemResponse.isSuccessful()) {
					setGardenMessage(` `);
					return plot.getItem().itemData.icon;
				} 
				const itemTemplate = placeholderItemTemplates.getInventoryTemplate(result.identifier);
				if (!itemTemplate) {
					setGardenMessage(`There was an error parsing the item id, please contact the developer`);
					return plot.getItem().itemData.icon;
				}
				const inventoryItem = inventory.getItem(itemTemplate);
				if (!(inventoryItem.isSuccessful())) {
					setGardenMessage(`There was an error parsing the item, please contact the developer`);
					return plot.getItem().itemData.icon;
				}
				//TODO: Fix this
				//Hack to ensure consistency between database and model item ids
				//After we update the database, it returns an id, which we assign to the newly
				//added inventoryItem
				(inventoryItem.payload as InventoryItem).setInventoryItemId(result.id);
				if (!pickupItemResponse.isSuccessful()) {
					setGardenMessage(` `);
					return plot.getItem().itemData.icon;
				}
				updateInventoryForceRefreshKey();
				saveInventory(inventory);
				saveGarden(garden);
				setGardenMessage(`Picked up ${pickupItemResponse.payload.pickedItem.itemData.name}.`);
				return plot.getItem().itemData.icon;
			  } catch (error) {
				console.error(error);
				//TODO: reload user to fix display issue with xp
				// const reloadedUser = loadUser() as User;
				// saveUser(reloadedUser);
				setGardenMessage(` `);
				return plot.getItem().itemData.icon;
			  } finally {
			  }
			
		}
		return helper;
	}

	const doNothing = (plot: Plot) => {
		const helper = () => {
			setGardenMessage(` `);
			return plot.getItem().itemData.icon;
		}
		return helper;
	}

	return {
		plantSeed,
		placeDecoration,
		clickPlant,
		clickDecoration,
		doNothing
	}

}