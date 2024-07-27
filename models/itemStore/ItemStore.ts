import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { InventoryItemTemplate } from "../items/templates/InventoryItemTemplate";
import { ItemTemplate } from "../items/templates/ItemTemplate";
import { InventoryTransactionResponse } from "./inventory/InventoryTransactionResponse";
import { ItemList } from "./ItemList";

/**
 * Abstract Class ItemStore
 * @class ItemStore
 */
export class ItemStore {
	protected items: ItemList;

	constructor(items: ItemList) {
		if (new.target == ItemStore) {
			throw new Error("Abstract classes can't be instantiated.");
		}
		this.items = items;
	}

	/**
	 * @returns a copy of the inventory items within the list.
	 */
	 getAllItems(): InventoryItem[] {
		return this.items.getAllItems();
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
     * Add an item to the inventory. If the item is already in inventory, updates quantity instead.
     * @param item - The item to add.
     * @param quantity - The quantity of the item to add.
     * @returns InventoryTransactionResponse containing the added InventoryItem or error message
     */
	protected addItem(item: InventoryItem | InventoryItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.items.addItem(item, quantity);
		return response;
	}

	/**
     * Update the quantity of an item in the inventory.
     * @param item - The item to update, identified by InventoryItem, ItemTemplate, or name.
     * @param delta - The amount to change the quantity by.
     * @returns InventoryTransactionResponse containing the updated InventoryItem or error message.
     */
	protected updateQuantity(item: InventoryItem | InventoryItemTemplate | string, delta: number): InventoryTransactionResponse {
		const response = this.items.updateQuantity(item, delta);
		return response;
	}

	/**
     * Delete an item from the inventory.
     * @param item - The item to delete, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the deleted InventoryItem or error message.
     */
	protected deleteItem(item: InventoryItem | InventoryItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.deleteItem(item);
		return response;
	}

	/**
	 * Deletes all items from the inventory.
	 * @returns InventoryTransactionResponse containing the deleted itemList or error message.
	 */
	protected deleteAll(): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		response.payload = this.items.deleteAll();
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