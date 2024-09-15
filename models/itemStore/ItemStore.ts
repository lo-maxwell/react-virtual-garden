import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemSubtype } from "../items/ItemTypes";
import { InventoryItemTemplate } from "../items/templates/models/InventoryItemTemplate";
import { ItemTemplate } from "../items/templates/models/ItemTemplate";
import { BooleanResponse } from "../utility/BooleanResponse";
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
	 * @subtype the subtype string, ie. SEED, HARVESTED, BLUEPRINT
	 * @category (optional) the category string, ie. Allium, Normal
	 * @returns a copy of the inventory items matching the given subtype
	 */
	getItemsBySubtype(subtype: ItemSubtype, category: string | null = null): InventoryItem[] {
		return this.items.getItemsBySubtype(subtype, category);
	}

	//TODO: Needs unit tests
	/**
	 * @returns a list of strings containing all the subtypes of items in this itemlist
	 */
	 getAllSubtypes(): string[] {
		return this.items.getAllSubtypes();
	}

	//TODO: Needs unit tests
	/**
	 * @subtype the subtype to search within
	 * @returns a list of strings containing all the categories of items in this itemlist
	 */
	getAllCategories(subtype: ItemSubtype): string[] {
		return this.items.getAllCategories(subtype);
	}

	/**
     * Gains quantity of item to inventory at no cost.
     * @item The item to add, identified by InventoryItem or ItemTemplate.
	 * @quantity Positive integer amount of item being added.
     * @returns InventoryTransactionResponse containing the added item or an error message.
     */
	 gainItem(item: InventoryItem | ItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.addItem(item, quantity);
		return response;
	}

	/**
     * Trashes quantity of item from inventory. Fails if item is not in inventory.
     * @item The item to remove, identified by InventoryItem, ItemTemplate, or name
	 * @quantity Positive integer amount of item being removed. If quantity is greater than the remaining amount, removes all existing ones.
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
     * @item The item to get, identified by InventoryItem, ItemTemplate, or name.
     * @returns InventoryTransactionResponse containing the found InventoryItem or error message.
     */
	 getItem(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = this.items.getItem(item);
		return response;
	}

	/**
     * Check if the inventory contains an item.
     * @item - The item to check for, identified by InventoryItem, ItemTemplate, or name.
     * @returns BooleanResponse containing True/False or error message.
     */
	contains(item: InventoryItem | ItemTemplate | string): BooleanResponse {
		const response = this.items.contains(item);
		return response;
	}

	/**
     * Add an item to the inventory. If the item is already in inventory, updates quantity instead.
     * @item The item to add.
     * @quantity The quantity of the item to add.
     * @returns InventoryTransactionResponse containing the added InventoryItem or error message
     */
	protected addItem(item: InventoryItem | InventoryItemTemplate, quantity: number): InventoryTransactionResponse {
		const response = this.items.addItem(item, quantity);
		return response;
	}

	/**
     * Update the quantity of an item in the inventory.
     * @item - The item to update, identified by InventoryItem, ItemTemplate, or name.
     * @delta - The amount to change the quantity by.
     * @returns InventoryTransactionResponse containing the updated InventoryItem or error message.
     */
	protected updateQuantity(item: InventoryItem | InventoryItemTemplate | string, delta: number): InventoryTransactionResponse {
		const response = this.items.updateQuantity(item, delta);
		return response;
	}

	/**
     * Delete an item from the inventory.
     * @item The item to delete, identified by InventoryItem, ItemTemplate, or name.
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