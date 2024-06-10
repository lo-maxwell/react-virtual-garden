import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemTemplate } from "../items/ItemTemplate";
import { InventoryTransactionResponse } from "./InventoryTransactionResponse";
import { ItemList } from "./ItemList";

export class Inventory {
	userId: string;
	gold: number;
	private items: ItemList;
	
	constructor(userId: string, gold: number = 0, items: ItemList) {
		this.userId = userId;
		this.gold = gold;
		this.items = items;
	}


	/**
     * Gains quantity of item to inventory at no cost.
     * @param item - The item to remove, identified by InventoryItem or ItemTemplate.
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
	trashItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		return this.items.updateQuantity(item, -1 * quantity);
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
		} else {
			//should never occur
			response.addErrorMessage(`Could not parse item: ${item}`);
			return response;
		}

		if (this.gold >= itemCost * quantity) {
			const buyItemResponse = this.addItem(item, quantity);
			if (buyItemResponse.isSuccessful()) {
				this.gold -= itemCost * quantity;
				response.payload = this.gold;
				return response;
			} else {
				return buyItemResponse;
			}
		} else {
			response.addErrorMessage(`Insufficient gold: had ${this.gold} but requires ${itemCost * quantity}`);
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
	 sellItem(item: InventoryItem | ItemTemplate, multiplier: number, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (!Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		let itemCost: number;
		if (ItemList.isInventoryItem(item)) {
			itemCost = item.itemData.getPrice(multiplier);
		} else if (ItemList.isItemTemplate(item)) {
			itemCost = item.getPrice(multiplier);
		} else {
			//should never occur
			response.addErrorMessage(`Could not parse item: ${item}`);
			return response;
		}

		const containsItem = this.items.containsAmount(item, quantity);
		if (!containsItem.isSuccessful()) {
			return containsItem;
		} else if (!containsItem.payload) {
			response.addErrorMessage(`Insufficient quantity in inventory: had ${this.items.get(item).payload.quantity} but requires ${quantity}`);
			return response;
		}

		const sellItemResponse = this.items.updateQuantity(item, -1 * quantity);
		if (sellItemResponse.isSuccessful()) {
			this.gold += itemCost * quantity;
			response.payload = true;
			return response;
		} else {
			return sellItemResponse;
		}
	}


	/**
     * Get an item from the inventory.
     * @param item - The item to get, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the found InventoryItem or error message.
     */
	get(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.get(item);
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
	addItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.items.addItem(item, quantity);
		return response;
	}

	/**
     * Update the quantity of an item in the inventory.
     * @param item - The item to update, identified by InventoryItem, ItemTemplate, or name.
     * @param delta - The amount to change the quantity by.
     * @returns InventoryTransactionResponse containing the updated InventoryItem or error message.
     */
	updateQuantity(item: InventoryItem | ItemTemplate | string, delta: number): InventoryTransactionResponse {
		const response = this.items.updateQuantity(item, delta);
		return response;
	}

	/**
     * Delete an item from the inventory.
     * @param item - The item to delete, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the deleted InventoryItem or error message.
     */
	deleteItem(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
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