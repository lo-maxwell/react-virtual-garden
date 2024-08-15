import { InventoryItem } from "@/models/items/inventoryItems/InventoryItem";
import { ItemSubtype, ItemSubtypes, ItemTypes } from "@/models/items/ItemTypes";
import { PlacedItem } from "@/models/items/placedItems/PlacedItem";
import { ItemTemplate } from "@/models/items/templates/models/ItemTemplate";
import { ItemList } from "@/models/itemStore/ItemList";
import { ItemHistoryTransactionResponse } from "./itemHistory/ItemHistoryTransactionResponse";
import ItemHistory from "./itemHistory/ItemHistory";
import { PlantHistory } from "./itemHistory/PlantHistory";
import { CustomResponse } from "@/models/utility/CustomResponse";
import { BooleanResponse } from "@/models/utility/BooleanResponse";
import { DecorationHistory } from "./itemHistory/DecorationHistory";

export class ItemHistoryList {
	private history: ItemHistory[];
	static fixedOrder = ['Plant', 'Decoration', 'Ground', 'Seed', 'HarvestedItem', 'Blueprint'];
	constructor(history: ItemHistory[] = []) {
		this.history = history;
		this.history.sort((a, b) => {
			const indexA = ItemHistoryList.fixedOrder.indexOf(a.getItemData().subtype);
			const indexB = ItemHistoryList.fixedOrder.indexOf(b.getItemData().subtype);
	
			// If a subtype is not in the fixedOrder array, it gets a large index number.
			// This keeps unknown subtypes at the end of the sorted array.
			const orderA = indexA !== -1 ? indexA : ItemHistoryList.fixedOrder.length;
			const orderB = indexB !== -1 ? indexB : ItemHistoryList.fixedOrder.length;
			
			if (orderA !== orderB) {
				return orderA - orderB;
			}

			//if subtype is the same, sort by name
			return a.getItemData().name.localeCompare(b.getItemData().name);
		});
	}

	static fromPlainObject(plainObject: any): ItemHistoryList {
		try {
            // Validate plainObject structure
            if (!plainObject || typeof plainObject !== 'object') {
                throw new Error('Invalid plainObject structure for PlantHistory');
            }
			const { itemHistories } = plainObject;
			const histories = itemHistories.map((itemHistory: any) => {
				if (!itemHistory) return null;
				switch (itemHistory.itemData.subtype) {
					case ItemSubtypes.PLANT.name:
						return PlantHistory.fromPlainObject(itemHistory);
					case ItemSubtypes.DECORATION.name:
						return DecorationHistory.fromPlainObject(itemHistory);
					case ItemSubtypes.GROUND.name:
					case ItemSubtypes.BLUEPRINT.name:
					case ItemSubtypes.SEED.name:
					case ItemSubtypes.HARVESTED.name:
					default:
						return null;
				}
			}).filter((item: null | ItemHistory) => item !== null);
			return new ItemHistoryList(histories);
			
		} catch (err) {
			console.error('Error creating ItemHistoryList from plainObject:', err);
            return new ItemHistoryList();
		}
	}

	toPlainObject(): any {
		const toReturn = {
			itemHistories: this.history.map(itemHistory => {
				return itemHistory.toPlainObject();
			}) // Convert each InventoryItem to a plain object
		};
		return toReturn;
	} 

	/**
	 * @returns a copy of the inventory items within the list.
	 */
	getAllHistories(): ItemHistory[] {
		return this.history.slice();
	}

	/**
	 * @subtype the subtype string, ie. SEED, HARVESTED, BLUEPRINT
	 * @category (optional) the category string, ie. Tree Fruit, Normal
	 * @returns a copy of the histories matching the given subtype
	 */
	getHistoriesBySubtype(subtype: ItemSubtype, category: string | null = null): ItemHistory[] {
		if (!category) {
			return this.history.slice().filter((element) => element.getItemData().subtype === subtype);
		}
		return this.history.slice().filter((element) => element.getItemData().subtype === subtype && element.getItemData().category === category);
	}

	//TODO: Needs unit tests
	/**
	 * @returns a list of strings containing all the subtypes of items in this historylist
	 */
	getAllSubtypes(): string[] {
		const subtypes: string[] = [];
		this.history.forEach((element) => {
			if (!subtypes.includes(element.getItemData().subtype)) {
				subtypes.push(element.getItemData().subtype);
			}
		})
		// Sort subtypes based on their index in the fixedOrder array
		subtypes.sort((a, b) => {
			const indexA = ItemHistoryList.fixedOrder.indexOf(a);
			const indexB = ItemHistoryList.fixedOrder.indexOf(b);
	
			// If a subtype is not in the fixedOrder array, it gets a large index number.
			// This keeps unknown subtypes at the end of the sorted array.
			const orderA = indexA !== -1 ? indexA : ItemHistoryList.fixedOrder.length;
			const orderB = indexB !== -1 ? indexB : ItemHistoryList.fixedOrder.length;
	
			return orderA - orderB;
		});
		return subtypes;
	}

	/**
	 * @subtype the subtype to search within
	 * @returns a list of strings containing all the categories of items in this itemlist
	 */
	getAllCategories(subtype: ItemSubtype): string[] {
		const categories: string[] = [];
		this.history.forEach((item) => {
			if (item.getItemData().subtype === subtype && !categories.includes(item.getItemData().category)) {
				categories.push(item.getItemData().category);
			}
		})
		categories.sort();
		return categories;
	}

	/**
     * Get a history object from the list, based on id.
     * @item The item to get, identified by InventoryItem or ItemTemplate.
     * @returns ItemHistoryTransactionResponse containing the found ItemHistory or error message.
     */
	getHistory(item: InventoryItem | PlacedItem | ItemTemplate | string): ItemHistoryTransactionResponse {
		const response = new ItemHistoryTransactionResponse();
		const itemIdResponse = ItemList.getItemId(item);
		if (!itemIdResponse.isSuccessful()) return itemIdResponse;
		const itemId = itemIdResponse.payload;

		this.history.forEach((element, index) => {
			if (element.getItemData().id == itemId) {
				response.payload = element;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.addErrorMessage(`ItemHistory for item ${itemId} not found`);
		return response;
	}

	/**
     * Check if the history list contains an item, based on id.
     * @item The item to check for, identified by InventoryItem, PlacedItem, ItemTemplate, or id.
     * @returns BooleanResponse containing True/False or error message.
     */
	contains(item: InventoryItem | PlacedItem | ItemTemplate | string): BooleanResponse {
		const response = new BooleanResponse();
		const itemIdResponse = ItemList.getItemId(item);
		if (!itemIdResponse.isSuccessful()) return itemIdResponse;
		const itemId = itemIdResponse.payload;
		
		this.history.forEach((element, index) => {
			if (element.getItemData().id == itemId) {
				response.payload = true;
				return response;
			}
		})
		return response;
	}

	/**
     * Add an ItemHistory object to the history list
     * @newHistory the history object to add
     * @returns ItemHistoryTransactionResponse containing the added history or error message
     */
	addItemHistory(newHistory: ItemHistory): ItemHistoryTransactionResponse {
		const response = new ItemHistoryTransactionResponse();
		//Check if history already contains this type
		if (this.contains(newHistory.getItemData()).payload) {
			//Update existing history
			const updateHistoryResponse = this.updateItemHistory(newHistory);
			if (!updateHistoryResponse.isSuccessful()) {
				return updateHistoryResponse;
			}
			response.payload = updateHistoryResponse.payload;
		} else {
			//Add new history
			this.history.push(newHistory);
			response.payload = newHistory;
		}
		return response;
	}

	/**
     * Update values in the history by combining 2 history objects.
     * @newHistory the history object to combine into original
     * @returns ItemHistoryTransactionResponse containing the updated history or error message.
     */
	updateItemHistory(newHistory: ItemHistory): ItemHistoryTransactionResponse {
		const response = new ItemHistoryTransactionResponse();
		if (this.contains(newHistory.getItemData()).payload) {
			const getHistoryResponse = this.getHistory(newHistory.getItemData());
			const originalHistory = getHistoryResponse.payload;
			if (!getHistoryResponse.isSuccessful() || !originalHistory) {
				//Should never occur, since we just checked contains
				return getHistoryResponse;
			}
			if (originalHistory.getItemData().subtype !== newHistory.getItemData().subtype) {
				response.addErrorMessage(`Error: cannot update item history of non matching subtypes: ${originalHistory.getItemData().subtype} and ${newHistory.getItemData().subtype}`)
				return response;
			}
			const combineResponse = originalHistory.combineHistory(newHistory);
			if (!combineResponse.isSuccessful()) {
				return combineResponse;
			}
			response.payload = combineResponse.payload;
		} else {
			response.addErrorMessage(`Error: Could not find history matching that id in HistoryList`);
			return response;
		}
		return response;
	}

	/**
     * Delete a history from the list.
     * @history the history object to delete
     * @returns ItemHistoryTransactionResponse containing the deleted ItemHistory or error message.
     */
	deleteHistory(history: ItemHistory): ItemHistoryTransactionResponse {
		const response = new ItemHistoryTransactionResponse();
		if (this.contains(history.getItemData()).payload) {
			const getHistoryResponse = this.getHistory(history.getItemData());
			const originalHistory = getHistoryResponse.payload;
			if (!getHistoryResponse.isSuccessful() || !originalHistory) {
				//Should never occur, since we just checked contains
				return getHistoryResponse;
			}
			const toDeleteIndex = this.history.indexOf(originalHistory);
			this.history.splice(toDeleteIndex, 1);
			response.payload = originalHistory;
		} else {
			response.addErrorMessage(`Error: Could not find history matching that id in HistoryList`);
			return response;
		}
		return response;
	}

	/**
	 * Deletes all items from the inventory.
	 * @returns CustomResponse containing the deleted ItemHistoryList or error message.
	 */
	deleteAll(): CustomResponse {
		const response = new CustomResponse();
		response.payload = this.getAllHistories();
		this.history = [];
		return response;
	}

	/**
     * Get the size of the history list.
     * @returns The number of history objects in the list
     */
	size(): number {
		return this.history.length;
	}
}