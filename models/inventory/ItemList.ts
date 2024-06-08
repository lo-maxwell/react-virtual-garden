
import { InventoryItem } from "../items/inventoryItems/InventoryItem";
import { ItemTemplate } from "../items/ItemTemplate";
import { ItemTypes } from "../items/ItemTypes";
import { InventoryTransactionResponse } from "./InventoryTransactionResponse";

export class ItemList {
	items: InventoryItem[];
	constructor(items: InventoryItem[] = []) {
		this.items = items;
	}

	get(item: ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (typeof item === 'string') {
			this.items.forEach((element, index) => {
				if (element.itemData.name == item) {
					response.payload = element;
					return response;
				}
			})
			response.addErrorMessage(`item ${item} not found`);
			return response;
		} else {
			if (item.type == ItemTypes.PLACED.name) {
				response.addErrorMessage(`Cannot get a placeditem from inventory`);
				return response;
			}
			this.items.forEach((element, index) => {
				if (element.itemData == item) {
					response.payload = element;
					return response;
				}
			})
			response.addErrorMessage(`item ${item.name} not found`);
			return response;
		}
	}

	contains(item: ItemTemplate | string): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		if (typeof item === 'string') {
			this.items.forEach((element, index) => {
				if (element.itemData.name == item) {
					response.payload = true;
					return response;
				}
			})
			response.payload = false;
			return response;
		} else {
			if (item.type == ItemTypes.PLACED.name) {
				response.addErrorMessage(`Cannot contain a placeditem in inventory`);
				response.payload = false;
				return response;
			}
			this.items.forEach((element, index) => {
				if (element.itemData == item) {
					response.payload = true;
					return response;
				}
			})
			response.payload = false;
			return response;
		}
	}

	addItem(item: InventoryItem): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let toUpdate = this.get(item.itemData);
		if (toUpdate.isSuccessful()) {
			toUpdate.payload.quantity = toUpdate.payload.quantity + item.quantity;
			response.payload = toUpdate.payload;
			return response;
		} else {
			const newItem = new InventoryItem(item.itemData, item.quantity);
			this.items.push(newItem);
			response.payload = newItem;
			return response;
		}
	}

	updateQuantity(item: InventoryItem, delta: number): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let toUpdate = this.get(item.itemData);
		if (toUpdate.isSuccessful()) {
			if (delta < 0 && toUpdate.payload.quantity + delta < 0) {
				response.addErrorMessage(`Not enough of ${item.itemData.name} to remove`)
				return response;
			}
			if (delta < 0 && toUpdate.payload.quantity + delta == 0) {
				return this.deleteItem(item);
			}

			toUpdate.payload.quantity = toUpdate.payload.quantity + delta;
			response.payload = toUpdate.payload;
			return response;
		} else {
			response.addErrorMessage("item not in inventory");
			return response;
		}
	}

	deleteItem(item: InventoryItem): InventoryTransactionResponse {
		const response = new InventoryTransactionResponse();
		let toDelete = this.get(item.itemData);
		if (toDelete.isSuccessful()) {
			response.payload = toDelete.payload;
			const toDeleteIndex = this.items.indexOf(toDelete.payload);
			this.items.splice(toDeleteIndex, 1);
			return response;
		} else {
			response.addErrorMessage("item not in inventory");
			return response;
		}
	}

	size(): number {
		return this.items.length;
	}
}