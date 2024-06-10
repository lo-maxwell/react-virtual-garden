
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemTemplate } from "../items/ItemTemplate";
import { ItemTypes } from "../items/ItemTypes";
import { InventoryTransactionResponse } from "./InventoryTransactionResponse";

export class ItemList {
	items: InventoryItem[];
	constructor(items: InventoryItem[] = []) {
		this.items = items;
	}

	isInventoryItem(item: any): item is InventoryItem {
		return (item as InventoryItem).quantity !== undefined;
	}
	
	isItemTemplate(item: any): item is ItemTemplate {
		return (item as ItemTemplate).basePrice !== undefined;
	}

	getItemName(item: InventoryItem | ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let itemName: string;
		if (typeof item === 'string') {
			itemName = item;
		} else if (typeof item === 'object' && this.isItemTemplate(item)) {
			itemName = item.name;
			if (item.type == ItemTypes.PLACED.name) {
				response.addErrorMessage(`Cannot get a placeditem from inventory`);
				return response;
			}
		} else if (typeof item === 'object' && this.isInventoryItem(item)) {
			itemName = item.itemData.name;
		} else {
			//Should never occur
			response.addErrorMessage(`Could not parse item: ${item}`);
			return response;
		}
		response.payload = itemName;
		return response;
	}

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

	/*
		item is only used to get the item template. 
		The quantity tied to item will be ignored, pass it as an additional argument instead.
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
			if (this.isInventoryItem(item)) {
				newItem = new InventoryItem(item.itemData, quantity);
			} else if (this.isItemTemplate(item)) {
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

	size(): number {
		return this.items.length;
	}
}