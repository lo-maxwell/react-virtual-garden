
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemTemplate } from "../items/ItemTemplate";
import { ItemTypes } from "../items/ItemTypes";
import { InventoryTransactionResponse } from "./InventoryTransactionResponse";

export class ItemList {
	items: InventoryItem[];
	constructor(items: InventoryItem[] = []) {
		this.items = items;
	}

	/**
     * Check if item is an InventoryItem.
	 * @param item - The item to check.
     * @returns True/False
     */
	static isInventoryItem(item: any): item is InventoryItem {
		return (item as InventoryItem).quantity !== undefined;
	}
	
	/**
     * Check if item is an ItemTemplate.
	 * @param item - The item to check.
     * @returns True/False
     */
	static isItemTemplate(item: any): item is ItemTemplate {
		return (item as ItemTemplate).basePrice !== undefined;
	}

	/**
     * Converts an InventoryItem or ItemTemplate to its item name. Strings are unaffected.
	 * @param item - The item to convert, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the name or an error message.
     */
	getItemName(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let itemName: string;
		if (typeof item === 'string') {
			itemName = item;
		} else if (typeof item === 'object' && ItemList.isItemTemplate(item)) {
			itemName = item.name;
			if (item.type == ItemTypes.PLACED.name) {
				response.addErrorMessage(`Cannot get a placeditem from inventory`);
				return response;
			}
		} else if (typeof item === 'object' && ItemList.isInventoryItem(item)) {
			itemName = item.itemData.name;
		} else {
			//Should never occur
			response.addErrorMessage(`Could not parse item: ${item}`);
			return response;
		}
		response.payload = itemName;
		return response;
	}

	/**
     * Get an item from the inventory.
     * @param item - The item to get, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the found InventoryItem or error message.
     */
	get(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		const itemNameResponse = this.getItemName(item);
		if (!itemNameResponse.isSuccessful()) return itemNameResponse;
		const itemName = itemNameResponse.payload;

		this.items.forEach((element, index) => {
			if (element.itemData.name == itemName) {
				response.payload = element;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.addErrorMessage(`item ${itemName} not found`);
		return response;
	}

	/**
     * Check if the inventory contains an item.
     * @param item - The item to check for, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing True/False or error message.
     */
	contains(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		const itemNameResponse = this.getItemName(item);
		if (!itemNameResponse.isSuccessful()) return itemNameResponse;
		const itemName = itemNameResponse.payload;
		
		this.items.forEach((element, index) => {
			if (element.itemData.name == itemName) {
				response.payload = true;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.payload = false;
		return response;
	}

	/**
     * Check if the inventory contains at least quantity of an item.
     * @param item - The item to check for, identified by InventoryItem, ItemTemplate, or name.
	 * @param quantity - Amount to require
     * @returns InventoryTransactionResponse containing True/False or error message.
     */
	 containsAmount(item: InventoryItem | ItemTemplate | string, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (quantity <= 0 || !Number.isInteger(quantity)) {
			response.addErrorMessage(`Invalid quantity: ${quantity}`);
			return response;
		}

		const itemNameResponse = this.getItemName(item);
		if (!itemNameResponse.isSuccessful()) return itemNameResponse;
		const itemName = itemNameResponse.payload;
		
		this.items.forEach((element, index) => {
			if (element.itemData.name == itemName && element.quantity >= quantity) {
				response.payload = true;
				return response;
			}
		})
		if (response.payload != null) return response;
		response.payload = false;
		return response;
	}

	/**
     * Add an item to the inventory.
     * @param item - The item to add.
     * @param quantity - The quantity of the item to add.
     * @returns InventoryTransactionResponse containing the added InventoryItem or error message
     */
	addItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();

		let toUpdate = this.get(item);
		if (toUpdate.isSuccessful()) {
			//Item already in inventory, update quantity
			if (quantity === 0) {
				response.addErrorMessage('Quantity is 0, no change');
				return response;
			}
			if (quantity < 0) {
				response.addErrorMessage('Cannot remove items with add. Try update instead.');
				return response;
			}
			toUpdate.payload.quantity = toUpdate.payload.quantity + quantity;
			response.payload = toUpdate.payload;
			return response;
		} else {
			//Add item to inventory
			let newItem: InventoryItem;
			if (ItemList.isInventoryItem(item)) {
				newItem = new InventoryItem(item.itemData, quantity);
			} else if (ItemList.isItemTemplate(item)) {
				newItem = new InventoryItem(item, quantity);
			} else {
				//should never occur
				response.addErrorMessage(`Could not parse item of type ${typeof item}`);
				return response;
			}
			if (quantity === 0) {
				response.addErrorMessage('Quantity is 0, no item added');
				return response;
			}
			if (quantity < 0) {
				response.addErrorMessage('Cannot remove items with add. Try update instead.');
				return response;
			}
			this.items.push(newItem);
			response.payload = newItem;
			return response;
		}
	}

	/**
     * Update the quantity of an item in the inventory.
     * @param item - The item to update, identified by InventoryItem, ItemTemplate, or name.
     * @param delta - The amount to change the quantity by. If negative and the final quantity ends up at or below 0, deletes the item from the list.
     * @returns InventoryTransactionResponse containing the updated InventoryItem or error message.
     */
	updateQuantity(item: InventoryItem | ItemTemplate | string, delta: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let toUpdate = this.get(item);
		if (toUpdate.isSuccessful()) {
			//Item already in inventory, update quantity
			if (delta < 0 && toUpdate.payload.quantity + delta <= 0) {
				return this.deleteItem(item);
			}

			toUpdate.payload.quantity = toUpdate.payload.quantity + delta;
			response.payload = toUpdate.payload;
			return response;
		} else {
			//Item not found, fail
			response.addErrorMessage("item not in inventory");
			return response;
		}
	}

	/**
     * Delete an item from the inventory.
     * @param item - The item to delete, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the deleted InventoryItem with quantity set to 0 or error message.
     */
	deleteItem(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let toDelete = this.get(item);
		if (toDelete.isSuccessful()) {
			//Item in inventory, delete
			response.payload = toDelete.payload;
			response.payload.quantity = 0;
			const toDeleteIndex = this.items.indexOf(toDelete.payload);
			this.items.splice(toDeleteIndex, 1);
			return response;
		} else {
			//Item not found, fail
			response.addErrorMessage("item not in inventory");
			return response;
		}
	}

	/**
     * Get the size of the inventory.
     * @returns The number of items in the inventory.
     */
	size(): number {
		return this.items.length;
	}
}