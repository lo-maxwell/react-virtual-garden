import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemTemplate } from "../items/ItemTemplate";
import { ItemTypes } from "../items/ItemTypes";
import { InventoryTransactionResponse } from "./InventoryTransactionResponse";
import { ItemList } from "./ItemList";

export class Inventory {
	private userId: string;
	private gold: number;
	private items: ItemList;
	
	constructor(userId: string, gold: number = 0, items: ItemList = new ItemList()) {
		this.userId = userId;
		this.gold = gold;
		this.items = items;
	}
	/**
	 * @returns the userId of the owner of the inventory.
	 */
	getUserId(): string {
		return this.userId;
	}

	/**
	 * @returns the amount of gold in inventory.
	 */
	getGold(): number {
		return this.gold;
	}

	/**
	 * @returns a copy of the inventory items within the list.
	 */
	 getAllItems(): InventoryItem[] {
		return this.items.getAllItems();
	}

	/**
     * Gains quantity gold.
	 * @param quantity - Positive integer amount of item being added.
     * @returns InventoryTransactionResponse containing the ending gold amount or an error message.
     */
	addGold(quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}
		this.gold += quantity;
		response.payload = this.gold;
		return response;
	}

	/**
     * Removes quantity gold from inventory. If reduced to below 0, sets gold to 0 instead.
	 * @param quantity - Positive integer amount of gold being removed.
     * @returns InventoryTransactionResponse containing the ending gold amount or an error message.
     */
	removeGold(quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}
		this.gold -= quantity;
		if (this.gold < 0) {
			this.gold = 0;
		}
		response.payload = this.gold;
		return response;
	}

	/**
     * Gains quantity of item to inventory at no cost.
     * @param item - The item to add, identified by InventoryItem or ItemTemplate.
	 * @param quantity - Positive integer amount of item being added.
     * @returns InventoryTransactionResponse containing the added item or an error message.
     */
	gainItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.addItem(item, quantity);
		return response;
	}

	/**
     * Trashes quantity of item from inventory. If item quantity goes to 0, deletes it from inventory. Fails if item is not in inventory.
     * @param item - The item to remove, identified by InventoryItem, ItemTemplate, or name
	 * @param quantity - Positive integer amount of item being removed. If quantity is greater than the remaining amount, removes all existing ones.
     * @returns InventoryTransactionResponse containing the item or an error message.
     */
	trashItem(item: InventoryItem | ItemTemplate | string, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		return this.updateQuantity(item, -1 * quantity);
	}

	/**
     * Spends gold to add items to inventory. Fails if there is not enough gold.
     * @param item - The item to add, identified by InventoryItem or ItemTemplate.
	 * @param multiplier - Value that the base price is modified by.
	 * @param quantity - Amount of item being purchased.
     * @returns InventoryTransactionResponse containing final gold amount or an error message.
     */
	buyItem(item: InventoryItem | ItemTemplate, multiplier: number, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		let itemCost: number;
		if (ItemList.isInventoryItem(item)) {
			itemCost = item.itemData.getPrice(multiplier);
		} else if (ItemList.isItemTemplate(item)) {
			itemCost = item.getPrice(multiplier);
			if (item.type === ItemTypes.PLACED.name) { //we check this before the addItem call so that we don't return not enough money
				response.addErrorMessage(`Cannot add a placeditem to inventory`);
				return response;
			}
		} else {
			//should never occur
			response.addErrorMessage(`Could not parse item: ${item}`);
			return response;
		}

		if (this.gold >= itemCost * quantity) {
			const buyItemResponse = this.addItem(item, quantity);
			if (buyItemResponse.isSuccessful()) {
				const removeGoldResponse = this.removeGold(itemCost * quantity);
				if (!removeGoldResponse.isSuccessful()) return removeGoldResponse;
				response.payload = this.getGold();
				return response;
			} else {
				return buyItemResponse;
			}
		} else {
			response.addErrorMessage(`Insufficient gold: had ${this.getGold()} but requires ${itemCost * quantity}`);
			return response;
		}
	}

	/**
     * Sells item from inventory. Fails if item is not in inventory.
     * @param item - The item to sell, identified by InventoryItem, ItemTemplate, or name
	 * @param multiplier - Value that the base price is modified by.
	 * @param quantity - Positive integer amount of item being sold.
     * @returns InventoryTransactionResponse containing the final gold amount or an error message.
     */
	 sellItem(item: InventoryItem | ItemTemplate | string, multiplier: number, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (!Number.isInteger(quantity) || quantity <= 0) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		let findItem = this.getItem(item);
		if (!findItem.isSuccessful()) {
			return findItem;
		}
		let itemCost: number = findItem.payload.itemData.getPrice(multiplier);

		const containsItem = this.items.containsAmount(item, quantity);
		if (!containsItem.payload) {
			const itemAmount = this.getItem(item).payload;
			if (itemAmount) {
				response.addErrorMessage(`Insufficient quantity in inventory: had ${itemAmount.quantity} but requires ${quantity}`);
			} else {
				response.addErrorMessage(`Insufficient quantity in inventory: had 0 but requires ${quantity}`);
			}
			return response;
		}

		const sellItemResponse = this.items.updateQuantity(item, -1 * quantity);
		if (sellItemResponse.isSuccessful()) {
			const addGoldResponse = this.addGold(itemCost * quantity);
			if (!addGoldResponse.isSuccessful()) return addGoldResponse;
			response.payload = this.getGold();
			return response;
		} else {
			return sellItemResponse;
		}
	}

	/**
	 * Consumes x quantity from the specified item. Fails if there is not enough quantity of item.
	 * If the quantity hits 0, deletes the item from the inventory.
	 * Performs a specific action depending on the item type:
	 * Blueprint -> returns the Decoration ItemTemplate corresponding to the Blueprint
	 * Seed -> returns the Plant ItemTemplate corresponding to the Seed
	 * HarvestedItem -> error
	 * @param item - The item to use, identified by InventoryItem, ItemTemplate, or name.
	 * @param quantity - the quantity of item consumed
	 * @returns a response containing the following object, or an error message
	 * {originalItem: InventoryItem
	 *  newTemplate: ItemTemplate}
	 */
	 useItem(item: InventoryItem | ItemTemplate | string, quantity: number): InventoryTransactionResponse {
		const response = this.items.useItem(item, quantity);
		if (response.isSuccessful()) {
			if (response.payload.originalItem.quantity <= 0) {
				const deleteResponse = this.deleteItem(response.payload.originalItem);
				if (!deleteResponse.isSuccessful()) {
					response.addErrorMessage(`Error deleting item after using down to 0 quantity`);
					return response;
				}
				//we throw away the response from delete if it succeeds
			}
		}
		return response;
	}

	/**
     * Find an item in the inventory.
     * @param item - The item to get, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the found InventoryItem or error message.
     */
	getItem(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.getItem(item);
		return response;
	}

	/**
     * Check if the inventory contains an item.
     * @param item - The item to check for, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing True/False or error message.
     */
	contains(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.contains(item);
		return response;
	}

	/**
     * Add an item to the inventory.
     * @param item - The item to add.
     * @param quantity - The quantity of the item to add.
     * @returns InventoryTransactionResponse containing the added InventoryItem or error message
     */
	private addItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.items.addItem(item, quantity);
		return response;
	}

	/**
     * Update the quantity of an item in the inventory.
     * @param item - The item to update, identified by InventoryItem, ItemTemplate, or name.
     * @param delta - The amount to change the quantity by.
     * @returns InventoryTransactionResponse containing the updated InventoryItem or error message.
     */
	private updateQuantity(item: InventoryItem | ItemTemplate | string, delta: number): InventoryTransactionResponse {
		const response = this.items.updateQuantity(item, delta);
		return response;
	}

	/**
     * Delete an item from the inventory.
     * @param item - The item to delete, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the deleted InventoryItem or error message.
     */
	private deleteItem(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.deleteItem(item);
		return response;
	}

	/**
     * Get the size of the inventory.
     * @returns The number of items in the inventory.
     */
	size() {
		return this.items.size();
	}

}